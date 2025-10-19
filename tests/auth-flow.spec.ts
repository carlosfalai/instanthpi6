import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://instanthpi.ca';

test('Demo login lands on dashboard without blank screen', async ({ page }) => {
  await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });

  // Prefer demo credentials path
  const email = page.locator('#email');
  const pwd = page.locator('#password');
  if ((await email.count()) > 0 && (await pwd.count()) > 0) {
    await email.fill('doctor@instanthpi.ca');
    await pwd.fill('medical123');
    const submitBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    if (await submitBtn.count()) {
      await submitBtn.click();
    } else {
      await page.locator('button[type="submit"]').first().click();
    }
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);

  expect(page.url()).toContain('/doctor-dashboard');
  const content = (await page.locator('body').textContent()) || '';
  expect(content.length).toBeGreaterThan(20);
});


