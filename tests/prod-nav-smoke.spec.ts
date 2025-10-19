import { test, expect } from '@playwright/test';

const BASE_URL = 'https://instanthpi.ca';

test.describe('Production Navigation Smoke', () => {
  test('doctor login -> dashboard -> traverse sidebar and back/forward', async ({ page }) => {
    // Go to login
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });

    // If already signed in banner appears, continue; otherwise demo login
    const banner = page.locator('text=already signed in', { hasText: undefined });
    const hasBanner = (await banner.count()) > 0;
    if (hasBanner) {
      await page.getByRole('button', { name: /continue/i }).click({ timeout: 3000 }).catch(() => {});
    } else {
      // fill demo creds if inputs exist
      const email = page.locator('#email');
      const pwd = page.locator('#password');
      if ((await email.count()) > 0 && (await pwd.count()) > 0) {
        await email.fill('doctor@instanthpi.ca');
        await pwd.fill('medical123');
        await page.getByRole('button', { name: /sign in/i }).click();
      }
    }

    await page.waitForLoadState('networkidle');

    // Ensure dashboard not blank: body must have text or main container
    const hasMain = await page.locator('main, [data-testid="dashboard-root"]').first().count();
    expect(hasMain).toBeGreaterThan(0);

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

    const bodyText = (await page.locator('body').textContent()) || '';
    expect(bodyText.length).toBeGreaterThan(20);
  });
});


