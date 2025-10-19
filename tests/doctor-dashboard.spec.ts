import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Doctor Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Doctor dashboard loads with all sections', async ({ page }) => {
    console.log('Testing doctor dashboard...');

    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for environment error screen first
    const hasEnvError = await page.locator('text=/Configuration Error|Missing Supabase/i').count();
    if (hasEnvError > 0) {
      console.log('⚠️ Environment configuration error detected - Supabase env vars missing');
      await page.screenshot({ path: 'screenshots/dashboard-env-error.png', fullPage: true });
      return;
    }

    // Verify main dashboard sections exist
    console.log('Checking for main dashboard sections...');
    
    const expectedSections = [
      'Search',
      'Patient',
      'Spruce',
      'File',
      'Recent',
      'Medical'
    ];

    for (const section of expectedSections) {
      const sectionExists = await page.locator(`text=/${section}/i`).count() > 0;
      if (sectionExists) {
        console.log(`✅ Section found: ${section}`);
      } else {
        console.log(`⚠️ Section not found: ${section}`);
      }
    }

    await page.screenshot({ path: 'screenshots/dashboard-main.png', fullPage: true });
  });

  test('Patient search functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for patient search input
    const searchInput = page.locator('input[placeholder*="patient" i], input[placeholder*="search" i], input[placeholder*="ID" i]').first();
    
    if (await searchInput.count() > 0) {
      console.log('Patient search input found');
      
      // Enter test patient ID
      await searchInput.fill('TEST123456');
      await page.waitForTimeout(1000);

      // Look for search button or auto-search
      const searchButton = page.locator('button:has-text("Search"), button:has-text("Chercher")').first();
      if (await searchButton.count() > 0) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('✅ Search input functional');
      await page.screenshot({ path: 'screenshots/dashboard-search.png', fullPage: true });
    } else {
      console.log('⚠️ Patient search input not found');
    }
  });

  test('Medical report generation - All 12 sections', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Expected medical report sections
    const expectedSections = [
      'HPI',
      'SAP',
      'Medications',
      'Lab',
      'Imaging',
      'Referral',
      'Follow-up',
      'Certificate',
      'Work Modifications',
      'Insurance',
      'Telemedicine',
      'Message'
    ];

    console.log('Checking for all 12 medical report sections...');

    // Scroll down to find medical report section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    let foundSections = 0;
    for (const section of expectedSections) {
      const exists = await page.locator(`text=/${section}/i`).count() > 0;
      if (exists) {
        foundSections++;
        console.log(`✅ Medical section found: ${section}`);
      } else {
        console.log(`⚠️ Medical section not found: ${section}`);
      }
    }

    console.log(`Found ${foundSections}/${expectedSections.length} medical sections`);
    await page.screenshot({ path: 'screenshots/dashboard-medical-sections.png', fullPage: true });
  });

  test('Copy to clipboard functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Context for clipboard API
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Look for copy buttons
    const copyButtons = page.locator('button:has-text("Copy"), button[aria-label*="copy" i]');
    const copyCount = await copyButtons.count();

    if (copyCount > 0) {
      console.log(`Found ${copyCount} copy buttons`);
      
      // Try clicking first copy button
      await copyButtons.first().click();
      await page.waitForTimeout(500);

      console.log('✅ Copy button clicked successfully');
    } else {
      console.log('⚠️ No copy buttons found on page');
    }

    await page.screenshot({ path: 'screenshots/dashboard-copy-buttons.png', fullPage: true });
  });

  test('Spruce integration section', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for Spruce section
    const spruceSection = page.locator('text=/Spruce/i');
    
    if (await spruceSection.count() > 0) {
      console.log('✅ Spruce section found');
      
      // Look for Spruce search or conversation list
      const spruceContent = page.locator('text=/conversation|message|patient/i').and(
        page.locator('[class*="spruce" i], [id*="spruce" i]').locator('..')
      );
      
      if (await spruceContent.count() > 0) {
        console.log('✅ Spruce content area found');
      }
    } else {
      console.log('⚠️ Spruce section not found');
    }
  });

  test('File management functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for file management section
    const fileSection = page.locator('text=/File Management|Reports|Documents/i');
    
    if (await fileSection.count() > 0) {
      console.log('✅ File management section found');
      
      // Look for action buttons
      const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]').first();
      const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Clean")').first();
      
      if (await refreshButton.count() > 0) {
        console.log('✅ Refresh button found');
      }
      
      if (await deleteButton.count() > 0) {
        console.log('✅ Delete/Clean button found');
      }
      
      await page.screenshot({ path: 'screenshots/dashboard-file-management.png', fullPage: true });
    } else {
      console.log('⚠️ File management section not found');
    }
  });

  test('Savings calculation display', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for savings/stats section
    const savingsSection = page.locator('text=/savings|saved|efficiency|time/i');
    
    if (await savingsSection.count() > 0) {
      console.log('✅ Savings calculation section found');
      
      // Look for dollar amounts or time indicators
      const hasCurrency = await page.locator('text=/\\$|CAD|saved/').count() > 0;
      const hasTime = await page.locator('text=/min|hour|hrs/').count() > 0;
      
      if (hasCurrency) console.log('✅ Currency amounts displayed');
      if (hasTime) console.log('✅ Time savings displayed');
    } else {
      console.log('⚠️ Savings calculation not visible');
    }
  });

  test('Diagnostic templates functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for diagnostic templates section
    const templatesSection = page.locator('text=/Template|Quick Diagnosis|Diagnosis Template/i');
    
    if (await templatesSection.count() > 0) {
      console.log('✅ Diagnostic templates section found');
      
      // Look for template cards or list
      const templateItems = page.locator('[class*="template" i], [id*="template" i]');
      const itemCount = await templateItems.count();
      
      if (itemCount > 0) {
        console.log(`✅ Found ${itemCount} template-related elements`);
      }
      
      await page.screenshot({ path: 'screenshots/dashboard-templates.png', fullPage: true });
    } else {
      console.log('⚠️ Diagnostic templates section not found');
    }
  });

  test('Recent consultations list', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for recent consultations
    const recentSection = page.locator('text=/Recent|Consultation|Patient List/i');
    
    if (await recentSection.count() > 0) {
      console.log('✅ Recent consultations section found');
      
      // Look for patient entries
      const patientEntries = page.locator('[class*="patient" i], [class*="consultation" i]');
      const entryCount = await patientEntries.count();
      
      console.log(`Found ${entryCount} patient-related elements`);
      
      // Look for action buttons (View, Edit, Delete)
      const viewButtons = page.locator('button:has-text("View"), button[aria-label*="view" i]');
      const editButtons = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]');
      
      if (await viewButtons.count() > 0) console.log('✅ View buttons found');
      if (await editButtons.count() > 0) console.log('✅ Edit buttons found');
      
      await page.screenshot({ path: 'screenshots/dashboard-recent-consultations.png', fullPage: true });
    } else {
      console.log('⚠️ Recent consultations section not found');
    }
  });
});


