import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://instanthpi.ca';

test('Demo login lands on dashboard without blank screen', async ({ page }) => {
  // Capture console logs
  const consoleLogs: Array<{type: string, text: string}> = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    console.log(`[Page Error] ${err.message}`);
    consoleLogs.push({ type: 'error', text: err.message });
  });
  
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
  
  console.log(`[Test] Final URL: ${page.url()}`);
  console.log(`[Test] All console logs captured:`, consoleLogs);

  expect(page.url()).toContain('/doctor-dashboard');
  const content = (await page.locator('body').textContent()) || '';
  console.log(`[Test] Body text length: ${content.length}`);
  console.log(`[Test] Body text full content (JSON):`);
  console.log(JSON.stringify(content));
  console.log(`[Test] Body text preview: ${content.substring(0, 100)}`);
  
  // Check for specific elements
  const sidebarCount = await page.locator('aside').count();
  const mainCount = await page.locator('main').count();
  const dashboardRootCount = await page.locator('[data-testid="dashboard-root"]').count();
  console.log(`[Test] Element counts - sidebar: ${sidebarCount}, main: ${mainCount}, dashboard-root: ${dashboardRootCount}`);
  
  // Check if error boundary is showing
  const errorMsg = await page.locator('text=/error|error/i').first();
  if (await errorMsg.count() > 0) {
    console.log(`[Test] Error message found:`, await errorMsg.textContent());
  }
  
  expect(content.length).toBeGreaterThan(20);
});


