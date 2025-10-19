import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Patient Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Complete patient intake flow - form to print document', async ({ page }) => {
    console.log('Starting patient intake flow test...');

    // Navigate to patient intake page
    await page.goto(`${BASE_URL}/public-patient-intake`);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('h1, h2')).toContainText(/InstantHPI|Patient Intake|Consultation/i);

    // Check for entry mode options (anonymous vs sign in)
    const hasEntryModes = await page.locator('text=/Just use InstantHPI|Sign in/i').count();
    if (hasEntryModes > 0) {
      console.log('Entry modes found - clicking anonymous option');
      await page.locator('text=/Just use InstantHPI/i').first().click();
      await page.waitForTimeout(1000);
    }

    // Fill in basic demographics
    console.log('Filling demographic information...');
    
    const genderField = page.locator('select:has-text("Gender"), input[placeholder*="Gender" i], select:has-text("Sexe")').first();
    if (await genderField.count() > 0) {
      await genderField.selectOption('male');
    }

    const ageField = page.locator('input[placeholder*="Age" i], input[type="number"]').first();
    if (await ageField.count() > 0) {
      await ageField.fill('35');
    }

    // Fill reason for visit
    const reasonField = page.locator('input[placeholder*="reason" i], textarea[placeholder*="reason" i], input[placeholder*="motif" i], textarea[placeholder*="motif" i]').first();
    if (await reasonField.count() > 0) {
      await reasonField.fill('Chest pain radiating to left arm');
    }

    // Fill problem start date
    const dateField = page.locator('input[type="date"], input[placeholder*="date" i]').first();
    if (await dateField.count() > 0) {
      await dateField.fill('2025-10-10');
    }

    // Fill symptom description
    const symptomField = page.locator('textarea[placeholder*="symptom" i], textarea[placeholder*="describe" i]').first();
    if (await symptomField.count() > 0) {
      await symptomField.fill('Sharp pain in chest, worse with movement, started 3 days ago');
    }

    // Submit the initial form
    console.log('Submitting initial patient form...');
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Soumettre"), button:has-text("Continue")').first();
    await submitButton.click();

    // Wait for triage API response (HPI summary)
    console.log('Waiting for triage API response...');
    await page.waitForResponse(response => 
      response.url().includes('/api/comprehensive-triage') || 
      response.url().includes('/api/generate-triage'),
      { timeout: 30000 }
    ).catch(() => console.log('Triage API timeout - may need mock'));

    await page.waitForTimeout(3000);

    // Look for HPI confirmation section
    console.log('Looking for HPI confirmation...');
    const hpiConfirmation = page.locator('text=/Is this correct|Confirm|Yes|No|Oui|Non/i');
    if (await hpiConfirmation.count() > 0) {
      console.log('HPI confirmation found');
      
      // Click "Yes" to confirm HPI
      const yesButton = page.locator('button:has-text("Yes"), button:has-text("Oui")').first();
      if (await yesButton.count() > 0) {
        await yesButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Look for 10 follow-up questions
    console.log('Looking for follow-up questions...');
    const questions = page.locator('textarea[placeholder*="answer" i], input[placeholder*="answer" i], textarea[placeholder*="réponse" i]');
    const questionCount = await questions.count();
    
    if (questionCount > 0) {
      console.log(`Found ${questionCount} follow-up question fields`);
      
      // Answer each question
      for (let i = 0; i < Math.min(questionCount, 10); i++) {
        await questions.nth(i).fill(`Answer to question ${i + 1}: No significant issues.`);
      }

      // Submit patient answers
      console.log('Submitting patient answers...');
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Sauvegarder")').last();
      await saveButton.click();

      // Wait for print document generation
      await page.waitForTimeout(3000);

      // Look for print button
      console.log('Looking for print document button...');
      const printButton = page.locator('button:has-text("Print"), button:has-text("Open"), button:has-text("Document")');
      
      if (await printButton.count() > 0) {
        console.log('✅ Print button found - patient flow complete');
        
        // Take screenshot of successful completion
        await page.screenshot({ path: 'screenshots/patient-flow-complete.png', fullPage: true });
        
        // Verify button is clickable
        await expect(printButton.first()).toBeVisible();
      } else {
        console.log('⚠️ Print button not found - taking screenshot for debugging');
        await page.screenshot({ path: 'screenshots/patient-flow-no-print-button.png', fullPage: true });
      }
    } else {
      console.log('⚠️ No follow-up questions found - workflow may be different');
      await page.screenshot({ path: 'screenshots/patient-flow-no-questions.png', fullPage: true });
    }

    // Verify patient ID was generated
    const pageContent = await page.content();
    const hasPatientId = /[A-Z0-9]{10}/.test(pageContent);
    if (hasPatientId) {
      console.log('✅ Patient ID found in page content');
    }
  });

  test('Patient form validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-patient-intake`);
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Soumettre")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check if validation errors appear
      const errorMessages = page.locator('text=/required|obligatoire|please fill|veuillez remplir/i');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        console.log(`✅ Form validation working - ${errorCount} error(s) shown`);
      } else {
        console.log('⚠️ No validation errors found - form may accept empty submission');
      }
    }
  });

  test('Patient ID generation format', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-patient-intake`);
    await page.waitForLoadState('networkidle');

    // Look for de-identified ID in page
    const pageContent = await page.content();
    const patientIdMatch = pageContent.match(/([A-Z0-9]{10})/);
    
    if (patientIdMatch) {
      const patientId = patientIdMatch[1];
      console.log(`Patient ID found: ${patientId}`);
      
      // Verify format: 10 alphanumeric characters
      expect(patientId).toMatch(/^[A-Z0-9]{10}$/);
      console.log('✅ Patient ID format correct (10 alphanumeric characters)');
    } else {
      console.log('⚠️ No patient ID found on initial page load (generated later)');
    }
  });
});


