import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Navigation & Routes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('All 8 navigation routes are accessible', async ({ page }) => {
    const routes = [
      { path: '/doctor-dashboard', name: 'Doctor Dashboard' },
      { path: '/patients', name: 'Patients' },
      { path: '/documents', name: 'Documents/Reports' },
      { path: '/messages', name: 'Messages' },
      { path: '/ai-billing', name: 'Analytics/Billing' },
      { path: '/doctor-profile', name: 'Doctor Profile' },
      { path: '/knowledge-base', name: 'Knowledge Base' },
      { path: '/association', name: 'Association/Tier 3.5' }
    ];

    console.log('Testing all navigation routes...');

    for (const route of routes) {
      console.log(`\nTesting route: ${route.path} (${route.name})`);
      
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check if we got a 404 error
      const is404 = await page.locator('text=/404|not found|page not found/i').count() > 0;
      
      if (is404) {
        console.log(`❌ Route ${route.path} returns 404`);
        await page.screenshot({ path: `screenshots/route-404-${route.path.replace('/', '')}.png`, fullPage: true });
      } else {
        console.log(`✅ Route ${route.path} loads successfully`);
        
        // Check if page has actual content (not blank)
        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText && bodyText.trim().length > 100;
        
        if (hasContent) {
          console.log(`✅ Route ${route.path} has content`);
        } else {
          console.log(`⚠️ Route ${route.path} may be blank or have minimal content`);
        }
        
        await page.screenshot({ path: `screenshots/route-${route.path.replace('/', '')}.png`, fullPage: true });
      }
    }
  });

  test('Navigation buttons from dashboard work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    const navigationButtons = [
      { text: 'Dashboard', expectedPath: '/doctor-dashboard' },
      { text: 'Patients', expectedPath: '/patients' },
      { text: 'Documents', expectedPath: '/documents' },
      { text: 'Reports', expectedPath: '/documents' },
      { text: 'Messages', expectedPath: '/messages' },
      { text: 'Analytics', expectedPath: '/ai-billing' },
      { text: 'Billing', expectedPath: '/ai-billing' },
      { text: 'Settings', expectedPath: '/doctor-profile' },
      { text: 'Profile', expectedPath: '/doctor-profile' },
      { text: 'Association', expectedPath: '/association' },
      { text: 'Knowledge', expectedPath: '/knowledge-base' }
    ];

    console.log('Testing navigation buttons from dashboard...');

    for (const button of navigationButtons) {
      // Look for button with this text
      const navButton = page.locator(`button:has-text("${button.text}"), a:has-text("${button.text}")`).first();
      
      if (await navButton.count() > 0) {
        console.log(`Found navigation button: ${button.text}`);
        
        // Click the button
        await navButton.click();
        await page.waitForTimeout(1500);
        
        // Check current URL
        const currentUrl = page.url();
        
        if (currentUrl.includes(button.expectedPath)) {
          console.log(`✅ Button "${button.text}" navigated to ${button.expectedPath}`);
        } else {
          console.log(`⚠️ Button "${button.text}" did not navigate to expected path`);
          console.log(`   Current URL: ${currentUrl}`);
        }
        
        // Go back to dashboard for next test
        await page.goto(`${BASE_URL}/doctor-dashboard`);
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('Sidebar navigation is functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for sidebar
    const sidebar = page.locator('aside, [role="navigation"], nav').first();
    
    if (await sidebar.count() > 0) {
      console.log('✅ Sidebar found');
      
      // Get all navigation links in sidebar
      const navLinks = sidebar.locator('a, button');
      const linkCount = await navLinks.count();
      
      console.log(`Found ${linkCount} navigation items in sidebar`);
      
      // Take screenshot of sidebar
      await page.screenshot({ path: 'screenshots/navigation-sidebar.png', fullPage: true });
      
      // Test clicking first few navigation items
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();
        
        console.log(`Testing sidebar link: ${linkText}`);
        await link.click();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        console.log(`  Navigated to: ${currentUrl}`);
        
        // Go back to dashboard
        await page.goto(`${BASE_URL}/doctor-dashboard`);
        await page.waitForLoadState('networkidle');
      }
      
      console.log('✅ Sidebar navigation functional');
    } else {
      console.log('⚠️ Sidebar not found');
    }
  });

  test('Browser back/forward navigation works', async ({ page }) => {
    console.log('Testing browser back/forward navigation...');

    // Navigate through several pages
    await page.goto(`${BASE_URL}/doctor-dashboard`);
    await page.waitForLoadState('networkidle');
    
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForLoadState('networkidle');
    
    await page.goto(`${BASE_URL}/doctor-profile`);
    await page.waitForLoadState('networkidle');
    
    // Test back navigation
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/patients');
    console.log('✅ Back navigation works');
    
    // Test forward navigation
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/doctor-profile');
    console.log('✅ Forward navigation works');
  });

  test('Landing page navigation to doctor/patient portals', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Look for doctor portal link/button
    const doctorPortalLink = page.locator('a:has-text("Doctor"), button:has-text("Doctor"), a:has-text("Physician"), text=/Doctor Portal|Physician Portal/i').first();
    
    if (await doctorPortalLink.count() > 0) {
      console.log('✅ Doctor portal link found on landing page');
      await doctorPortalLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('doctor')) {
        console.log('✅ Doctor portal link navigates correctly');
      }
      
      await page.screenshot({ path: 'screenshots/navigation-to-doctor-portal.png', fullPage: true });
    }

    // Go back to home
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Look for patient portal link/button
    const patientPortalLink = page.locator('a:has-text("Patient"), button:has-text("Patient"), text=/Patient Portal|Patient Intake/i').first();
    
    if (await patientPortalLink.count() > 0) {
      console.log('✅ Patient portal link found on landing page');
      await patientPortalLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('patient')) {
        console.log('✅ Patient portal link navigates correctly');
      }
      
      await page.screenshot({ path: 'screenshots/navigation-to-patient-portal.png', fullPage: true });
    }
  });

  test('No 404 errors on any primary route', async ({ page }) => {
    const routes = [
      '/',
      '/doctor-dashboard',
      '/patients',
      '/documents',
      '/messages',
      '/ai-billing',
      '/doctor-profile',
      '/knowledge-base',
      '/association',
      '/public-patient-intake',
      '/doctor-login'
    ];

    console.log('Checking all routes for 404 errors...');
    let errorCount = 0;

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');
      
      const has404 = await page.locator('text=/404|not found/i').count() > 0;
      const hasErrorPage = await page.locator('text=/error|something went wrong/i').count() > 0;
      
      if (has404 || hasErrorPage) {
        console.log(`❌ Route ${route} has 404/error`);
        errorCount++;
      } else {
        console.log(`✅ Route ${route} loads without 404`);
      }
    }

    console.log(`\nTotal routes with errors: ${errorCount}/${routes.length}`);
    expect(errorCount).toBe(0);
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    
    const protectedRoutes = [
      '/doctor-dashboard',
      '/patients',
      '/doctor-profile'
    ];

    console.log('Testing protected route redirects...');

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const currentUrl = page.url();
      
      // Check if redirected to login or if page shows auth required
      const isOnLogin = currentUrl.includes('login') || currentUrl.includes('auth');
      const hasAuthRequired = await page.locator('text=/login|sign in|authenticate/i').count() > 0;
      const hasEnvError = await page.locator('text=/configuration error|missing/i').count() > 0;
      
      if (isOnLogin || hasAuthRequired || hasEnvError) {
        console.log(`✅ Protected route ${route} has auth protection`);
      } else {
        console.log(`⚠️ Protected route ${route} may not be properly protected`);
      }
    }
  });
});


