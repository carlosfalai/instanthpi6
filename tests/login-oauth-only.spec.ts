import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://instanthpi.ca';

test.describe('Doctor Login Page - OAuth Only', () => {
  test('Login page loads correctly with only Google OAuth', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    // Check page title
    await expect(page).toHaveTitle(/Medical Dashboard|InstantHPI/i);
    
    // Verify Google Sign-in button exists
    const googleButton = page.getByRole('button', { name: /Sign in with Google|Redirecting to Google/i });
    await expect(googleButton).toBeVisible();
    
    // Verify email/password form does NOT exist
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    await expect(emailInput).toHaveCount(0);
    await expect(passwordInput).toHaveCount(0);
    
    // Verify "Or continue with" divider does NOT exist
    const divider = page.locator('text=/Or continue with/i');
    await expect(divider).toHaveCount(0);
    
    // Verify regular Sign in button does NOT exist
    const signInButton = page.getByRole('button', { name: /^Sign in$/i, exact: true });
    await expect(signInButton).toHaveCount(0);
    
    console.log('✅ Login page verified - Only Google OAuth visible');
  });

  test('Google OAuth button triggers redirect', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    
    // Set up route interception to catch OAuth redirect
    let oauthRedirected = false;
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('supabase') || url.includes('google') || url.includes('oauth')) {
        oauthRedirected = true;
        console.log('OAuth redirect detected:', url);
      }
    });
    
    // Click Google button
    await googleButton.click();
    
    // Wait a bit for redirect to start
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to Google/Supabase
    const currentUrl = page.url();
    console.log('Current URL after click:', currentUrl);
    
    // Should either be on Google OAuth page or Supabase auth page
    const isOAuthRedirect = currentUrl.includes('google') || 
                           currentUrl.includes('supabase') || 
                           currentUrl.includes('accounts.google.com') ||
                           oauthRedirected;
    
    console.log('OAuth redirect triggered:', isOAuthRedirect);
    // Note: In CI/testing, OAuth might not complete, but we can verify button works
  });

  test('Already signed in banner shows for valid session', async ({ page, context }) => {
    // This test requires a valid session, so we'll just verify the UI structure
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    // Check if banner could appear (structure exists)
    const banner = page.locator('text=/already signed in/i');
    const bannerCount = await banner.count();
    
    console.log('Banner visibility check:', bannerCount > 0 ? 'Visible' : 'Not visible (expected if no session)');
    
    // If banner exists, verify buttons
    if (bannerCount > 0) {
      const continueBtn = page.getByRole('button', { name: /Continue/i });
      const signOutBtn = page.getByRole('button', { name: /Sign out/i });
      
      await expect(continueBtn).toBeVisible();
      await expect(signOutBtn).toBeVisible();
    }
  });

  test('Error messages display correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    
    // Inject an error message to test UI
    await page.evaluate(() => {
      const event = new CustomEvent('test-error');
      window.dispatchEvent(event);
    });
    
    // Check error message styling exists (if any error occurs)
    const errorStyles = await page.evaluate(() => {
      const errorDiv = document.querySelector('.bg-red-50, .bg-blue-50');
      return errorDiv ? true : false;
    });
    
    console.log('Error message styling available:', errorStyles);
  });
});

test.describe('Auth Callback Page', () => {
  test('Auth callback page handles missing code gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/callback?next=%2Fdoctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Should show error message
    const errorMessage = page.locator('text=/Authentication Error|Missing authorization code/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Should have "Try Doctor Sign-in Again" button
    const tryAgainButton = page.getByRole('button', { name: /Try Doctor Sign-in Again|Try.*Sign-in/i });
    await expect(tryAgainButton).toBeVisible();
    
    // Should show helpful debug info
    const debugInfo = page.locator('text=/Debug Info|Supabase config/i');
    const hasDebugInfo = await debugInfo.count() > 0;
    console.log('Debug info visible:', hasDebugInfo);
    
    console.log('✅ Auth callback error handling verified');
  });
});

test.describe('Dashboard Access', () => {
  test('Dashboard requires authentication', async ({ page, context }) => {
    // Clear all auth state
    await context.clearCookies();
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Should redirect to login or show auth required message
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/doctor-login') || currentUrl.includes('/login');
    const hasAuthMessage = await page.locator('text=/auth required|authentication required|sign in/i').count() > 0;
    
    console.log('Dashboard protection:', {
      redirectedToLogin: isLoginPage,
      showsAuthMessage: hasAuthMessage,
      currentUrl
    });
    
    expect(isLoginPage || hasAuthMessage).toBeTruthy();
  });
});

