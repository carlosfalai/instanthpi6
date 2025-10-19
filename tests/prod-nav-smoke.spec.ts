import { test, expect } from '@playwright/test';

const BASE_URL = 'https://instanthpi.ca';

test.describe('Production Navigation Smoke', () => {
  test('doctor login -> dashboard -> traverse sidebar and back/forward', async ({ page, context }) => {
    // Clear cookies only (can't clear localStorage on production domain)
    await context.clearCookies();

    // Go to login
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Page URL after goto:', page.url());
    console.log('Page title:', await page.title());

    // Check for already-signed-in banner first
    const bannerText = await page.locator('body').textContent();
    console.log('Checking for banner in page content...');
    
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const signOutBtn = page.locator('button:has-text("Sign out")').first();
    
    const hasContinue = (await continueBtn.count()) > 0;
    const hasSignOut = (await signOutBtn.count()) > 0;
    
    console.log('Has Continue button:', hasContinue);
    console.log('Has Sign out button:', hasSignOut);

    if (hasContinue && hasSignOut) {
      console.log('Already signed in banner found, clicking Continue');
      await continueBtn.click({ timeout: 3000 });
    } else {
      console.log('No banner found, attempting demo login');
      // fill demo creds if inputs exist
      const email = page.locator('#email');
      const pwd = page.locator('#password');
      const emailCount = await email.count();
      const pwdCount = await pwd.count();
      console.log('Email input count:', emailCount, 'Password input count:', pwdCount);
      
      if (emailCount > 0 && pwdCount > 0) {
        console.log('Filling credentials...');
        await email.fill('doctor@instanthpi.ca');
        await pwd.fill('medical123');
        
        const submitBtn = page.getByRole('button', { name: 'Sign In', exact: true });
        const submitCount = await submitBtn.count();
        console.log('Submit button count:', submitCount);
        
        if (submitCount > 0) {
          console.log('Clicking Sign In button');
          await submitBtn.click();
        } else {
          console.log('Clicking first submit button');
          await page.locator('button[type="submit"]').first().click();
        }
      } else {
        throw new Error('Email/password inputs not found on login page');
      }
    }

    console.log('Waiting for network to idle after login...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('URL after login:', page.url());

    // Ensure dashboard not blank: body must have text or main container
    const mainCount = await page.locator('main').count();
    const dashboardRootCount = await page.locator('[data-testid="dashboard-root"]').count();
    console.log('Main count:', mainCount, 'Dashboard root count:', dashboardRootCount);

    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);
    console.log('Page contains "Dashboard":', bodyText?.includes('Dashboard'));
    console.log('Page contains "Search Patients":', bodyText?.includes('Search Patients'));

    // Debug: check what's actually on the page
    const authRequiredText = bodyText?.includes('Authentication Required') ?? false;
    const checkingAuthText = bodyText?.includes('Checking authentication') ?? false;
    const loaderSpinnerText = bodyText?.includes('Loader2') ?? false;
    
    console.log('Auth required card visible:', authRequiredText);
    console.log('Checking auth text visible:', checkingAuthText);
    console.log('Loader text visible:', loaderSpinnerText);
    console.log('Full body text:', bodyText?.substring(0, 200));

    expect(mainCount + dashboardRootCount).toBeGreaterThan(0);

    // Click sidebar items if present
    const targets = [
      { label: /Patients/i, path: '/patients' },
      { label: /Reports|Documents/i, path: '/documents' },
      { label: /Messages/i, path: '/messages' },
      { label: /Analytics|Billing/i, path: '/ai-billing' },
      { label: /Settings|Profile/i, path: '/doctor-profile' },
    ];

    for (const t of targets) {
      const btn = page.locator('aside').getByRole('button', { name: t.label }).first();
      if ((await btn.count()) === 0) continue;
      await btn.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(t.path);
      // Not blank
      const bodyText = (await page.locator('body').textContent()) || '';
      expect(bodyText.length).toBeGreaterThan(20);
    }

    // Back/forward stability
    for (let i = 0; i < 3; i++) {
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
    for (let i = 0; i < 3; i++) {
      await page.goForward();
      await page.waitForLoadState('networkidle');
    }

    const finalBodyText = (await page.locator('body').textContent()) || '';
    expect(finalBodyText.length).toBeGreaterThan(20);
  });
});


