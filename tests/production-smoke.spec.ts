import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://instanthpi.ca';

test.describe('Production Smoke Tests - instanthpi.ca', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Console Error] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', err => {
      console.log(`[Page Error] ${err.message}`);
    });
  });

  test('Landing page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for main content
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText.length).toBeGreaterThan(50);
    
    // Check for patient intake form or login button
    const hasForm = await page.locator('form').count() > 0;
    const hasLoginButton = await page.getByRole('button', { name: /login|sign in/i }).count() > 0;
    expect(hasForm || hasLoginButton).toBeTruthy();
  });

  test('Patient intake form is accessible and functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient-intake`, { waitUntil: 'networkidle' });
    
    // Check form exists
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    
    // Check for key form fields
    const hasInputs = await page.locator('input, textarea, select').count();
    expect(hasInputs).toBeGreaterThan(0);
    
    // Verify no critical errors
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText).not.toContain('Error:');
    expect(bodyText).not.toContain('TypeError');
  });

  test('Doctor login flow works (demo credentials)', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    // Check login page loaded
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText.length).toBeGreaterThan(20);
    
    // Fill demo credentials
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('doctor@instanthpi.ca');
      await passwordInput.fill('medical123');
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /sign in/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      } else {
        await page.locator('button[type="submit"]').first().click();
      }
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verify dashboard loaded (not blank)
      const dashboardUrl = page.url();
      expect(dashboardUrl).toContain('/doctor-dashboard');
      
      const dashboardBody = await page.locator('body').textContent() || '';
      expect(dashboardBody.length).toBeGreaterThan(100);
      
      // Check for dashboard elements
      const hasMain = await page.locator('main').count() > 0;
      const hasDashboardRoot = await page.locator('[data-testid="dashboard-root"]').count() > 0;
      expect(hasMain || hasDashboardRoot).toBeTruthy();
    }
  });

  test('Dashboard renders without JavaScript errors', async ({ page, context }) => {
    // Clear cookies to ensure fresh login
    await context.clearCookies();
    
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    // Login
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('doctor@instanthpi.ca');
      await passwordInput.fill('medical123');
      
      const submitButton = page.getByRole('button', { name: /sign in/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      } else {
        await page.locator('button[type="submit"]').first().click();
      }
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // Check dashboard
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (!text.includes('favicon') && !text.includes('net::ERR')) {
          errors.push(text);
        }
      }
    });
    
    const dashboardBody = await page.locator('body').textContent() || '';
    
    // Verify no critical errors
    expect(dashboardBody).not.toContain('sg.slice is not a function');
    expect(dashboardBody).not.toContain('TypeError');
    expect(dashboardBody.length).toBeGreaterThan(100);
    
    // Check that arrays are handled safely (no undefined errors)
    const criticalErrors = errors.filter(e => 
      e.includes('slice is not a function') || 
      e.includes('map is not a function') ||
      e.includes('filter is not a function')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('API endpoints respond correctly', async ({ page }) => {
    // Test that critical API endpoints are accessible
    const endpoints = [
      '/api/comprehensive-triage',
      '/api/file-management/list',
      '/api/spruce-conversations-all',
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      
      // Should not be 404 or 500 (may be 401/403 for auth, which is expected)
      const status = response.status();
      expect([404, 500]).not.toContain(status);
    }
  });

  test('Navigation between pages works', async ({ page, context }) => {
    // Clear cookies
    await context.clearCookies();
    
    // Login first
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('doctor@instanthpi.ca');
      await passwordInput.fill('medical123');
      
      const submitButton = page.getByRole('button', { name: /sign in/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      } else {
        await page.locator('button[type="submit"]').first().click();
      }
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Test navigation to different pages
    const pages = [
      { name: 'Patients', selector: /patients/i, path: '/patients' },
      { name: 'Documents', selector: /documents|reports/i, path: '/documents' },
      { name: 'Messages', selector: /messages/i, path: '/messages' },
    ];
    
    for (const pageTest of pages) {
      // Try to find and click sidebar button
      const button = page.locator('aside').getByRole('button', { name: pageTest.selector }).first();
      if (await button.count() > 0) {
        await button.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Verify page loaded
        const url = page.url();
        expect(url).toContain(pageTest.path);
        
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.length).toBeGreaterThan(20);
      }
    }
  });

  test('Form submission handles timeouts gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient-intake`, { waitUntil: 'networkidle' });
    
    // Fill minimal form data
    const form = page.locator('form').first();
    if (await form.count() > 0) {
      // Try to fill some basic fields if they exist
      const ageInput = page.locator('input[type="number"], input[name*="age" i]').first();
      if (await ageInput.count() > 0) {
        await ageInput.fill('30');
      }
      
      const genderSelect = page.locator('select[name*="gender" i], select').first();
      if (await genderSelect.count() > 0) {
        await genderSelect.selectOption({ index: 1 });
      }
      
      // Submit form (this will test timeout handling)
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        // Set a shorter timeout for this test
        await Promise.race([
          submitButton.click(),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        
        // Wait a bit to see if error handling works
        await page.waitForTimeout(2000);
        
        // Check that page didn't crash
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.length).toBeGreaterThan(20);
      }
    }
  });
});

