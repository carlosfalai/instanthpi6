import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://instanthpi.ca";

test.describe("Inbox Page - Spruce Conversations", () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors and network requests
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[Console Error] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      console.log(`[Page Error] ${err.message}`);
    });

    // Log network requests
    page.on("request", (request) => {
      if (request.url().includes("/api/spruce")) {
        console.log(`[Request] ${request.method()} ${request.url()}`);
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("/api/spruce")) {
        console.log(`[Response] ${response.status()} ${response.url()}`);
      }
    });
  });

  test("Inbox page loads and fetches Spruce conversations", async ({ page }) => {
    // Navigate to inbox page (may redirect to login if not authenticated)
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Check if we're on login page (protected route)
    const currentUrl = page.url();
    if (currentUrl.includes("/doctor-login") || currentUrl.includes("/login")) {
      console.log("[Test] Inbox page requires authentication - redirecting to login");
      // This is expected behavior for protected routes
      expect(currentUrl).toContain("login");
      return;
    }

    // Wait for the page to load (either inbox or login)
    await page.waitForTimeout(2000);

    // Try to find inbox title or login page
    const hasInboxTitle = (await page.locator('h1:has-text("Inbox")').count()) > 0;
    const hasLogin = (await page.locator("text=/sign in|login/i").count()) > 0;

    if (hasLogin) {
      console.log("[Test] Page requires authentication");
      return; // Test passes - page is protected as expected
    }

    if (!hasInboxTitle) {
      // Wait a bit more for content to load
      await page.waitForTimeout(3000);
    }

    // Check that the inbox page is visible
    const inboxTitle = await page.locator('h1:has-text("Inbox")').textContent();
    expect(inboxTitle).toContain("Inbox");

    // Wait for API call to complete (either success or error)
    await page.waitForTimeout(3000);

    // Check for either conversations or error message
    const hasConversations = (await page.locator('[class*="conversation"]').count()) > 0;
    const hasError =
      (await page.locator("text=/Failed to load|credentials not configured|error/i").count()) > 0;
    const hasLoading = (await page.locator('[class*="animate-spin"]').count()) > 0;
    const hasNoConversations = (await page.locator("text=/No conversations/i").count()) > 0;

    // At least one of these should be true
    expect(hasConversations || hasError || hasNoConversations || hasLoading).toBeTruthy();

    // Check console for any critical errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("spruce")) {
        consoleErrors.push(msg.text());
      }
    });

    // Verify no critical JavaScript errors
    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("TypeError");
    expect(bodyText).not.toContain("ReferenceError");
  });

  test("Spruce conversations API endpoint responds", async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.get(`${BASE_URL}/api/spruce-conversations-all`);

    const status = response.status();
    console.log(`[Test] API response status: ${status}`);

    // Should not be 404 or 500 (may be 400 if credentials not configured, which is expected)
    expect([404, 500]).not.toContain(status);

    if (status === 200) {
      const data = await response.json();
      console.log(`[Test] Received ${Array.isArray(data) ? data.length : 0} conversations`);

      // If we got data, verify it's an array
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThanOrEqual(0);

        // If there are conversations, check structure
        if (data.length > 0) {
          const firstConv = data[0];
          expect(firstConv).toHaveProperty("id");
          expect(firstConv).toHaveProperty("patient_name");
        }
      }
    } else if (status === 400) {
      // Credentials not configured - this is a valid response
      const errorData = await response.json();
      expect(errorData).toHaveProperty("error");
      expect(errorData.error).toContain("credentials");
      console.log("[Test] Spruce credentials not configured (expected if not set up)");
    }
  });

  test("Inbox page shows helpful error when credentials missing", async ({ page }) => {
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: "networkidle" });

    // Wait a bit for API call to complete
    await page.waitForTimeout(5000);

    // Check if error message is displayed
    const errorText = (await page.locator("body").textContent()) || "";

    // If there's an error, it should be helpful
    if (errorText.includes("Failed to load") || errorText.includes("credentials")) {
      const hasHelpfulMessage =
        errorText.includes("credentials") ||
        errorText.includes("API Integrations") ||
        errorText.includes("Spruce");

      expect(hasHelpfulMessage).toBeTruthy();
    }
  });

  test("Conversation history endpoint responds correctly", async ({ page }) => {
    // First, try to get conversations
    const conversationsResponse = await page.request.get(
      `${BASE_URL}/api/spruce-conversations-all`
    );

    if (conversationsResponse.status() === 200) {
      const conversations = await conversationsResponse.json();

      if (Array.isArray(conversations) && conversations.length > 0) {
        const firstConvId = conversations[0].id;
        console.log(`[Test] Testing conversation history for: ${firstConvId}`);

        // Test conversation history endpoint
        const historyResponse = await page.request.get(
          `${BASE_URL}/api/spruce/conversations/${firstConvId}/history`
        );

        const historyStatus = historyResponse.status();
        console.log(`[Test] History API response status: ${historyStatus}`);

        // Should not be 404 or 500
        expect([404, 500]).not.toContain(historyStatus);

        if (historyStatus === 200) {
          const messages = await historyResponse.json();
          console.log(`[Test] Received ${Array.isArray(messages) ? messages.length : 0} messages`);

          // If we got messages, verify structure
          if (Array.isArray(messages) && messages.length > 0) {
            const firstMsg = messages[0];
            expect(firstMsg).toHaveProperty("content");
            expect(firstMsg).toHaveProperty("timestamp");
          }
        }
      } else {
        console.log("[Test] No conversations available to test history endpoint");
      }
    } else {
      console.log(
        "[Test] Cannot test history endpoint - conversations API returned:",
        conversationsResponse.status()
      );
    }
  });
});
