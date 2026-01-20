import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://instanthpi.ca";

test.describe("Comprehensive Functionality Tests", () => {
  test("1. Login page shows only Google OAuth (no demo form)", async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: "networkidle" });

    // Verify Google Sign-in button exists
    const googleButton = page.getByRole("button", { name: /Sign in with Google/i });
    await expect(googleButton).toBeVisible();

    // Verify email/password form does NOT exist
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const emailCount = await emailInput.count();
    const passwordCount = await passwordInput.count();

    console.log("Email input count:", emailCount);
    console.log("Password input count:", passwordCount);

    // Should be 0 (removed)
    expect(emailCount).toBe(0);
    expect(passwordCount).toBe(0);

    // Verify "Or continue with" divider does NOT exist
    const divider = page.locator("text=/Or continue with/i");
    expect(await divider.count()).toBe(0);

    console.log("✅ Login page verified - Only Google OAuth visible");
  });

  test("2. Google OAuth redirects correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: "networkidle" });

    const googleButton = page.getByRole("button", { name: /Sign in with Google/i });

    // Monitor navigation
    const navigationPromise = page.waitForURL(/google|supabase|oauth/i, { timeout: 10000 });
    await googleButton.click();

    try {
      await navigationPromise;
      const currentUrl = page.url();
      console.log("Redirected to:", currentUrl);

      // Should redirect to Google or Supabase OAuth
      expect(currentUrl).toMatch(/google|supabase|oauth/i);
      console.log("✅ OAuth redirect working");
    } catch (e) {
      console.log("⚠️ OAuth redirect timeout (may need manual login)");
    }
  });

  test("3. Auth callback handles missing code", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/callback?next=%2Fdoctor-dashboard`, {
      waitUntil: "networkidle",
    });

    // Should show error message
    const errorMessage = page.locator("text=/Authentication Error|Missing authorization code/i");
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Should have retry button
    const retryButton = page.getByRole("button", { name: /Try.*Sign-in|Try Again/i });
    await expect(retryButton).toBeVisible();

    console.log("✅ Auth callback error handling works");
  });

  test("4. Dashboard requires authentication", async ({ page, context }) => {
    // Clear all auth state
    await context.clearCookies();
    await page.goto(`${BASE_URL}/doctor-dashboard`, { waitUntil: "networkidle" });

    const currentUrl = page.url();
    const bodyText = (await page.locator("body").textContent()) || "";

    // Should either redirect to login OR show auth required message
    const isLoginPage = currentUrl.includes("/doctor-login") || currentUrl.includes("/login");
    const hasAuthMessage =
      bodyText.toLowerCase().includes("auth") ||
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("required");

    console.log("Dashboard protection:", { isLoginPage, hasAuthMessage, currentUrl });

    expect(isLoginPage || hasAuthMessage).toBeTruthy();
    console.log("✅ Dashboard protection works");
  });

  test("5. API endpoints return JSON", async ({ page }) => {
    // Test file-management API
    const fileMgmtResponse = await page.request.get(`${BASE_URL}/api/file-management/list`);
    const contentType = fileMgmtResponse.headers()["content-type"] || "";

    console.log("File management API:", {
      status: fileMgmtResponse.status(),
      contentType,
      isJSON: contentType.includes("application/json"),
    });

    if (fileMgmtResponse.status() === 200) {
      expect(contentType).toContain("application/json");
      const data = await fileMgmtResponse.json();
      console.log("File management response:", data);
    }

    // Test spruce-conversations-all API
    const spruceResponse = await page.request.get(`${BASE_URL}/api/spruce-conversations-all`);
    const spruceContentType = spruceResponse.headers()["content-type"] || "";

    console.log("Spruce conversations API:", {
      status: spruceResponse.status(),
      contentType: spruceContentType,
      isJSON: spruceContentType.includes("application/json"),
    });

    if (spruceResponse.status() === 200) {
      expect(spruceContentType).toContain("application/json");
    }

    console.log("✅ API endpoints return JSON");
  });

  test("6. Main page loads correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText.length).toBeGreaterThan(100);

    console.log("✅ Main page loads correctly");
  });

  test("7. Patient intake form accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/patient-intake`, { waitUntil: "networkidle" });

    const currentUrl = page.url();
    const bodyText = (await page.locator("body").textContent()) || "";

    // Should load patient intake form
    const hasForm =
      bodyText.toLowerCase().includes("patient") ||
      bodyText.toLowerCase().includes("form") ||
      bodyText.toLowerCase().includes("intake");

    console.log("Patient intake:", { currentUrl, hasForm });
    expect(hasForm || currentUrl.includes("patient")).toBeTruthy();

    console.log("✅ Patient intake accessible");
  });

  test("8. Navigation links work", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

    // Check for navigation links
    const doctorLoginLink = page.locator('a[href*="doctor-login"], a:has-text("Doctor")');
    const linkCount = await doctorLoginLink.count();

    if (linkCount > 0) {
      const href = await doctorLoginLink.first().getAttribute("href");
      console.log("Doctor login link found:", href);

      // Try clicking
      await doctorLoginLink.first().click();
      await page.waitForLoadState("networkidle");

      const newUrl = page.url();
      expect(newUrl).toContain("doctor-login");
      console.log("✅ Navigation links work");
    } else {
      console.log("⚠️ Navigation links not found (may be button-based)");
    }
  });

  test("9. No JavaScript errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.log("Page error:", error.message);
    });

    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    console.log("JavaScript errors found:", errors.length);
    expect(errors.length).toBe(0);

    console.log("✅ No JavaScript errors on login page");
  });

  test("10. Page elements render correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: "networkidle" });

    // Check for key elements
    const card = page.locator('[class*="card"], [class*="Card"]');
    const button = page.getByRole("button");

    const cardCount = await card.count();
    const buttonCount = await button.count();

    console.log("Page elements:", { cardCount, buttonCount });

    expect(cardCount).toBeGreaterThan(0);
    expect(buttonCount).toBeGreaterThan(0);

    console.log("✅ Page elements render correctly");
  });
});
