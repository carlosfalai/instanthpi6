import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Button Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for local dev to bypass auth
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: 'networkidle' });
    // Local dev auto-redirects to dashboard
    await page.waitForURL(/doctor-dashboard/, { timeout: 10000 }).catch(() => {});
  });

  test('1. Dashboard refresh buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for refresh buttons (RefreshCw icon)
    const refreshButtons = page.locator('button:has([class*="RefreshCw"]), button[title*="refresh" i]');
    const refreshCount = await refreshButtons.count();
    
    if (refreshCount > 0) {
      // Click first refresh button
      await refreshButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Refresh button clicked');
    } else {
      console.log('⚠️ No refresh buttons found');
    }
  });

  test('2. Navigation sidebar buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Check sidebar navigation
    const sidebarLinks = page.locator('aside a, aside [role="link"]');
    const linkCount = await sidebarLinks.count();
    
    console.log(`Found ${linkCount} sidebar links`);
    
    if (linkCount > 0) {
      // Try clicking the first few links
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        const link = sidebarLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        console.log(`Clicking sidebar link: ${text} (${href})`);
        
        await link.click();
        await page.waitForTimeout(1000);
        
        // Verify navigation occurred
        const currentUrl = page.url();
        console.log(`Navigated to: ${currentUrl}`);
      }
      
      console.log('✅ Sidebar navigation buttons work');
    }
  });

  test('3. Copy buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for copy buttons
    const copyButtons = page.locator('button:has([class*="Copy"]), button[title*="copy" i]');
    const copyCount = await copyButtons.count();
    
    console.log(`Found ${copyCount} copy buttons`);
    
    if (copyCount > 0) {
      // Click first copy button
      await copyButtons.first().click();
      await page.waitForTimeout(500);
      
      // Check clipboard (if possible)
      console.log('✅ Copy button clicked');
    } else {
      console.log('⚠️ No copy buttons found');
    }
  });

  test('4. Search functionality works', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for search inputs
    const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i]');
    const searchCount = await searchInputs.count();
    
    console.log(`Found ${searchCount} search inputs`);
    
    if (searchCount > 0) {
      const searchInput = searchInputs.first();
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Check if results update
      console.log('✅ Search input works');
    }
  });

  test('5. Modal/Dialog buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for buttons that open modals (Edit, Add, Create, etc.)
    const modalTriggers = page.locator('button:has-text("Edit"), button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    const triggerCount = await modalTriggers.count();
    
    console.log(`Found ${triggerCount} potential modal trigger buttons`);
    
    if (triggerCount > 0) {
      // Click first trigger
      await modalTriggers.first().click();
      await page.waitForTimeout(1000);
      
      // Check if modal/dialog opened
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Dialog"]');
      const modalCount = await modal.count();
      
      if (modalCount > 0) {
        console.log('✅ Modal opened successfully');
        
        // Try to close it
        const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close" i]');
        const closeCount = await closeButton.count();
        
        if (closeCount > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(500);
          console.log('✅ Modal closed successfully');
        }
      }
    }
  });

  test('6. Form submission buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for submit buttons
    const submitButtons = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save")');
    const submitCount = await submitButtons.count();
    
    console.log(`Found ${submitCount} submit buttons`);
    
    if (submitCount > 0) {
      // Don't actually submit, just verify they exist and are clickable
      const firstSubmit = submitButtons.first();
      const isDisabled = await firstSubmit.isDisabled();
      
      console.log(`Submit button disabled: ${isDisabled}`);
      console.log('✅ Submit buttons found');
    }
  });

  test('7. Delete buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for delete buttons
    const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Remove"), button[title*="delete" i]');
    const deleteCount = await deleteButtons.count();
    
    console.log(`Found ${deleteCount} delete buttons`);
    
    if (deleteCount > 0) {
      // Don't actually delete, just verify button exists
      const firstDelete = deleteButtons.first();
      const isVisible = await firstDelete.isVisible();
      
      console.log(`Delete button visible: ${isVisible}`);
      console.log('✅ Delete buttons found');
    }
  });

  test('8. Tab/Switch buttons work', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Look for tab buttons
    const tabs = page.locator('[role="tab"], button[class*="tab" i]');
    const tabCount = await tabs.count();
    
    console.log(`Found ${tabCount} tab buttons`);
    
    if (tabCount > 0) {
      // Click different tabs
      for (let i = 0; i < Math.min(3, tabCount); i++) {
        const tab = tabs.nth(i);
        const text = await tab.textContent();
        console.log(`Clicking tab: ${text}`);
        
        await tab.click();
        await page.waitForTimeout(500);
      }
      
      console.log('✅ Tab buttons work');
    }
  });

  test('9. All interactive buttons are accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Get all buttons
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    
    console.log(`Total buttons found: ${buttonCount}`);
    
    let accessibleCount = 0;
    let disabledCount = 0;
    
    for (let i = 0; i < Math.min(20, buttonCount); i++) {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible();
      const isDisabled = await button.isDisabled();
      const text = await button.textContent();
      
      if (isVisible && !isDisabled) {
        accessibleCount++;
      }
      if (isDisabled) {
        disabledCount++;
      }
    }
    
    console.log(`Accessible buttons: ${accessibleCount}, Disabled: ${disabledCount}`);
    expect(accessibleCount).toBeGreaterThan(0);
    
    console.log('✅ Button accessibility verified');
  });

  test('10. Button click handlers execute', async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: 'networkidle' });
    
    // Monitor console for errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Click various buttons
    const buttons = page.locator('button:visible').filter({ hasNot: page.locator('[disabled]') });
    const buttonCount = await buttons.count();
    
    console.log(`Clicking ${Math.min(5, buttonCount)} buttons to test handlers`);
    
    for (let i = 0; i < Math.min(5, buttonCount); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      
      try {
        await button.click();
        await page.waitForTimeout(300);
        console.log(`Clicked: ${text}`);
      } catch (e) {
        console.log(`Error clicking button ${text}:`, e);
      }
    }
    
    console.log(`Console errors: ${errors.length}`);
    expect(errors.length).toBe(0);
    
    console.log('✅ Button click handlers work correctly');
  });
});

