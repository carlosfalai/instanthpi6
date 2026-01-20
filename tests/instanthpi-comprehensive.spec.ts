import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";

// Test configuration
const BASE_URL = "https://instanthpi.ca";
const SCREENSHOT_DIR = "screenshots";

// Helper function to wait for page load and take screenshot
async function takeScreenshot(page: Page, name: string, description?: string) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  });
  console.log(`Screenshot taken: ${name} - ${description || "No description"}`);
}

// Helper function to check for common UI elements
async function checkCommonElements(page: Page) {
  const commonSelectors = [
    "header",
    "nav",
    "main",
    "footer",
    '[role="navigation"]',
    '[role="main"]',
    '[role="banner"]',
    '[role="contentinfo"]',
  ];

  const foundElements = [];
  for (const selector of commonSelectors) {
    const element = await page.$(selector);
    if (element) {
      foundElements.push(selector);
    }
  }
  return foundElements;
}

test.describe("InstantHPI Comprehensive Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for slow network requests
    page.setDefaultTimeout(30000);
  });

  test("1. Main Page Analysis and Screenshot", async ({ page }) => {
    console.log("Testing main page...");

    // Navigate to main page
    await page.goto("/");

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Take main page screenshot
    await takeScreenshot(page, "main-page", "Homepage of InstantHPI");

    // Check page title
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // Check for common elements
    const commonElements = await checkCommonElements(page);
    console.log("Common UI elements found:", commonElements);

    // Check for key content
    const headings = await page.$$eval("h1, h2, h3", (elements) =>
      elements.map((el) => ({ tag: el.tagName, text: el.textContent?.trim() }))
    );
    console.log("Main headings:", headings);

    // Check for navigation links
    const navLinks = await page.$$eval('nav a, [role="navigation"] a', (elements) =>
      elements.map((el) => ({ text: el.textContent?.trim(), href: el.getAttribute("href") }))
    );
    console.log("Navigation links:", navLinks);

    // Check for buttons
    const buttons = await page.$$eval('button, [role="button"]', (elements) =>
      elements.map((el) => ({ text: el.textContent?.trim(), type: el.getAttribute("type") }))
    );
    console.log("Buttons found:", buttons);

    // Verify page loaded successfully
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test("2. Doctor Login Page and Google Sign-in", async ({ page }) => {
    console.log("Testing doctor login page...");

    // Navigate to doctor login
    await page.goto("/doctor-login");
    await takeScreenshot(page, "doctor-login-page", "Doctor login page");

    // Check for login elements
    const loginElements = await page.$$eval('input, button, [role="button"]', (elements) =>
      elements.map((el) => ({
        tag: el.tagName,
        type: el.getAttribute("type"),
        placeholder: el.getAttribute("placeholder"),
        text: el.textContent?.trim(),
      }))
    );
    console.log("Login elements found:", loginElements);

    // Look for Google sign-in button
    const googleSignInSelectors = [
      '[data-testid*="google"]',
      'button[aria-label*="Google"]',
      'button[title*="Google"]',
      'button:has-text("Google")',
      'button:has-text("Sign in with Google")',
      '[class*="google"]',
      '[id*="google"]',
    ];

    let googleButton = null;
    for (const selector of googleSignInSelectors) {
      try {
        googleButton = await page.$(selector);
        if (googleButton) {
          console.log(`Google sign-in button found with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (googleButton) {
      await takeScreenshot(page, "google-signin-button", "Google sign-in button found");

      // Test clicking the Google button (but don't complete the OAuth flow)
      try {
        console.log("Testing Google sign-in button click...");
        await googleButton.click();

        // Wait for potential redirect or popup
        await page.waitForTimeout(3000);
        await takeScreenshot(page, "after-google-click", "After clicking Google sign-in");

        // Check if we're redirected to Google OAuth or if there's an error
        const currentUrl = page.url();
        console.log(`URL after Google button click: ${currentUrl}`);

        if (currentUrl.includes("google") || currentUrl.includes("oauth")) {
          console.log("✅ Google OAuth flow initiated successfully");
        } else if (currentUrl.includes("error")) {
          console.log("⚠️ Error page detected after Google sign-in attempt");
        }
      } catch (error) {
        console.log("❌ Error testing Google sign-in:", error);
      }
    } else {
      console.log("❌ Google sign-in button not found");
    }

    // Check for other authentication options
    const authOptions = await page.$$eval('form, [role="form"]', (elements) =>
      elements.map((el) => ({
        action: el.getAttribute("action"),
        method: el.getAttribute("method"),
        inputs: Array.from(el.querySelectorAll("input")).map((input) => ({
          type: input.getAttribute("type"),
          name: input.getAttribute("name"),
          placeholder: input.getAttribute("placeholder"),
        })),
      }))
    );
    console.log("Authentication forms found:", authOptions);
  });

  test("3. Patient Intake Form Testing", async ({ page }) => {
    console.log("Testing patient intake form...");

    // Try common paths for patient intake
    const intakePaths = [
      "/patient-intake",
      "/intake",
      "/patient",
      "/new-patient",
      "/patient-form",
      "/form",
    ];

    let intakePageFound = false;
    for (const path of intakePaths) {
      try {
        await page.goto(path);
        const response = await page.waitForResponse((resp) => resp.url().includes(path));
        if (response.status() === 200) {
          console.log(`✅ Patient intake found at: ${path}`);
          intakePageFound = true;
          await takeScreenshot(page, "patient-intake-form", `Patient intake form at ${path}`);
          break;
        }
      } catch (error) {
        console.log(`❌ No intake form at ${path}`);
      }
    }

    if (!intakePageFound) {
      // Check main page for intake form links
      await page.goto("/");
      const intakeLinks = await page.$$eval("a", (elements) =>
        elements
          .filter((el) => {
            const text = el.textContent?.toLowerCase();
            const href = el.getAttribute("href");
            return (
              text?.includes("intake") ||
              text?.includes("patient") ||
              text?.includes("form") ||
              href?.includes("intake") ||
              href?.includes("patient")
            );
          })
          .map((el) => ({ text: el.textContent, href: el.getAttribute("href") }))
      );

      console.log("Potential intake form links:", intakeLinks);

      // Try clicking the first intake link if found
      if (intakeLinks.length > 0) {
        try {
          await page.click(`a[href="${intakeLinks[0].href}"]`);
          await page.waitForLoadState("networkidle");
          await takeScreenshot(page, "intake-via-link", "Intake form accessed via link");
          intakePageFound = true;
        } catch (error) {
          console.log("❌ Error clicking intake link:", error);
        }
      }
    }

    if (intakePageFound) {
      // Analyze the intake form
      const formElements = await page.$$eval("form input, form select, form textarea", (elements) =>
        elements.map((el) => ({
          type: el.getAttribute("type") || el.tagName,
          name: el.getAttribute("name"),
          placeholder: el.getAttribute("placeholder"),
          required: el.hasAttribute("required"),
        }))
      );
      console.log("Intake form fields:", formElements);

      // Look for medical-specific fields
      const medicalFields = formElements.filter((field) => {
        const name = field.name?.toLowerCase() || "";
        const placeholder = field.placeholder?.toLowerCase() || "";
        return (
          name.includes("symptom") ||
          name.includes("medical") ||
          name.includes("history") ||
          name.includes("condition") ||
          placeholder.includes("symptom") ||
          placeholder.includes("medical")
        );
      });
      console.log("Medical-specific fields:", medicalFields);
    } else {
      console.log("❌ Patient intake form not found");
    }
  });

  test("4. Doctor Dashboard Exploration", async ({ page }) => {
    console.log("Exploring doctor dashboard features...");

    // Try common dashboard paths
    const dashboardPaths = ["/dashboard", "/doctor-dashboard", "/doctor", "/admin", "/portal"];

    let dashboardFound = false;
    for (const path of dashboardPaths) {
      try {
        await page.goto(path);
        await page.waitForTimeout(2000);

        // Check if we're redirected to login or if we see dashboard content
        const currentUrl = page.url();
        const pageContent = await page.content();

        if (currentUrl.includes("login") || currentUrl.includes("auth")) {
          console.log(`${path} requires authentication (redirected to login)`);
        } else if (pageContent.includes("dashboard") || pageContent.includes("patient")) {
          console.log(`✅ Dashboard-like content found at: ${path}`);
          await takeScreenshot(page, `dashboard-${path.replace("/", "")}`, `Dashboard at ${path}`);
          dashboardFound = true;

          // Analyze dashboard elements
          const dashboardElements = await page.$$eval(
            '[class*="dashboard"], [id*="dashboard"], [data-testid*="dashboard"]',
            (elements) =>
              elements.map((el) => ({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                text: el.textContent?.substring(0, 100),
              }))
          );
          console.log("Dashboard elements:", dashboardElements);

          // Look for patient-related features
          const patientFeatures = await page.$$eval("*", (elements) =>
            elements
              .filter((el) => {
                const text = el.textContent?.toLowerCase() || "";
                return text.includes("patient") || text.includes("hpi") || text.includes("history");
              })
              .slice(0, 10)
              .map((el) => ({
                tag: el.tagName,
                text: el.textContent?.substring(0, 100),
              }))
          );
          console.log("Patient-related features:", patientFeatures);
        }
      } catch (error) {
        console.log(`❌ Error accessing ${path}:`, error.message);
      }
    }

    if (!dashboardFound) {
      console.log("❌ Doctor dashboard not accessible without authentication");
    }
  });

  test("5. Chrome Extension Integration Check", async ({ page }) => {
    console.log("Checking for Chrome extension integration...");

    await page.goto("/");

    // Look for extension-related content
    const extensionKeywords = ["extension", "chrome", "browser", "install", "add-on"];
    let extensionContent = [];

    for (const keyword of extensionKeywords) {
      const elements = await page.$$eval(
        "*",
        (elements, kw) =>
          elements
            .filter((el) => {
              const text = el.textContent?.toLowerCase() || "";
              return text.includes(kw);
            })
            .map((el) => ({
              tag: el.tagName,
              text: el.textContent?.substring(0, 200),
              href: el.getAttribute("href"),
            })),
        keyword
      );

      if (elements.length > 0) {
        extensionContent.push({ keyword, elements: elements.slice(0, 5) });
      }
    }

    console.log("Extension-related content:", extensionContent);

    // Check for Chrome Web Store links
    const webStoreLinks = await page.$$eval('a[href*="chrome.google.com"]', (elements) =>
      elements.map((el) => ({
        text: el.textContent,
        href: el.getAttribute("href"),
      }))
    );

    if (webStoreLinks.length > 0) {
      console.log("✅ Chrome Web Store links found:", webStoreLinks);
      await takeScreenshot(page, "chrome-extension-links", "Chrome extension integration found");
    } else {
      console.log("❌ No Chrome Web Store links found");
    }

    // Check for extension installation instructions
    const instructionElements = await page.$$eval("*", (elements) =>
      elements
        .filter((el) => {
          const text = el.textContent?.toLowerCase() || "";
          return (
            text.includes("install") && (text.includes("extension") || text.includes("chrome"))
          );
        })
        .map((el) => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 300),
        }))
    );

    console.log("Extension installation instructions:", instructionElements);
  });

  test("6. Netlify Functions and Integrations Discovery", async ({ page }) => {
    console.log("Looking for Netlify functions and integrations...");

    await page.goto("/");

    // Check for Netlify-specific paths
    const netlifyPaths = ["/.netlify/functions/", "/api/", "/.well-known/", "/functions/"];

    const functionEndpoints = [];
    for (const path of netlifyPaths) {
      try {
        const response = await page.request.get(path);
        console.log(`${path}: ${response.status()}`);
        if (response.status() !== 404) {
          functionEndpoints.push({ path, status: response.status() });
        }
      } catch (error) {
        console.log(`❌ Error checking ${path}:`, error.message);
      }
    }

    console.log("Netlify function endpoints:", functionEndpoints);

    // Check network requests for API calls
    const apiRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/api/") ||
        url.includes("/.netlify/") ||
        url.includes("/functions/") ||
        url.includes("lambda")
      ) {
        apiRequests.push({
          url: url,
          method: request.method(),
          resourceType: request.resourceType(),
        });
      }
    });

    // Trigger some interactions to capture API calls
    await page.reload();
    await page.waitForTimeout(5000);

    console.log("API requests detected:", apiRequests);

    // Check for third-party integrations
    const integrationHints = await page.evaluate(() => {
      const hints = [];

      // Check for common integration scripts
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      scripts.forEach((script) => {
        const src = script.src;
        if (
          src.includes("google") ||
          src.includes("stripe") ||
          src.includes("twilio") ||
          src.includes("sendgrid") ||
          src.includes("supabase") ||
          src.includes("firebase")
        ) {
          hints.push({ type: "script", src });
        }
      });

      // Check for API keys or integration configs in HTML
      const content = document.documentElement.outerHTML;
      const patterns = [
        /stripe[_-]?key/i,
        /google[_-]?api/i,
        /supabase[_-]?url/i,
        /twilio[_-]?sid/i,
      ];

      patterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          hints.push({ type: "config", pattern: pattern.source });
        }
      });

      return hints;
    });

    console.log("Integration hints:", integrationHints);

    if (integrationHints.length > 0 || functionEndpoints.length > 0 || apiRequests.length > 0) {
      await takeScreenshot(page, "integrations-detected", "Page with integrations detected");
    }
  });

  test("7. Complete Workflow Test", async ({ page }) => {
    console.log("Testing complete workflow from patient intake to doctor dashboard...");

    // Start from homepage
    await page.goto("/");
    await takeScreenshot(page, "workflow-start", "Starting complete workflow test");

    // Track the user journey
    const journey = [];

    // Look for patient entry point
    const patientLinks = await page.$$eval("a", (elements) =>
      elements
        .filter((el) => {
          const text = el.textContent?.toLowerCase() || "";
          const href = el.getAttribute("href") || "";
          return (
            text.includes("patient") ||
            text.includes("start") ||
            text.includes("begin") ||
            href.includes("patient")
          );
        })
        .map((el) => ({ text: el.textContent, href: el.getAttribute("href") }))
    );

    journey.push({ step: "homepage", action: "found patient links", data: patientLinks });

    if (patientLinks.length > 0) {
      try {
        await page.click(`a[href="${patientLinks[0].href}"]`);
        await page.waitForLoadState("networkidle");
        await takeScreenshot(page, "workflow-patient-entry", "Patient entry point");
        journey.push({ step: "patient-entry", action: "navigated", url: page.url() });

        // Look for form fields to fill
        const formFields = await page.$$eval("input, textarea, select", (elements) =>
          elements.map((el) => ({
            type: el.getAttribute("type") || el.tagName,
            name: el.getAttribute("name"),
            placeholder: el.getAttribute("placeholder"),
          }))
        );

        journey.push({ step: "form-analysis", action: "found fields", data: formFields });

        // Try to fill out a basic form if present
        if (formFields.length > 0) {
          for (const field of formFields.slice(0, 5)) {
            // Limit to first 5 fields
            try {
              if (field.type === "text" || field.type === "email") {
                await page.fill(`[name="${field.name}"]`, "test@example.com");
              } else if (field.type === "tel") {
                await page.fill(`[name="${field.name}"]`, "555-123-4567");
              } else if (field.tagName === "TEXTAREA") {
                await page.fill(`[name="${field.name}"]`, "Test symptoms and medical history");
              }
            } catch (error) {
              console.log(`Could not fill field ${field.name}:`, error.message);
            }
          }

          await takeScreenshot(page, "workflow-form-filled", "Form filled with test data");
          journey.push({ step: "form-filling", action: "completed" });
        }
      } catch (error) {
        console.log("❌ Error in patient workflow:", error.message);
        journey.push({ step: "patient-entry", action: "failed", error: error.message });
      }
    }

    console.log("Complete workflow journey:", journey);

    // Test responsiveness
    const viewports = [
      { width: 1920, height: 1080, name: "desktop" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 375, height: 667, name: "mobile" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await takeScreenshot(page, `responsive-${viewport.name}`, `${viewport.name} viewport test`);
    }
  });

  test("8. Performance and Accessibility Check", async ({ page }) => {
    console.log("Checking performance and accessibility...");

    await page.goto("/");

    // Check for common accessibility elements
    const accessibilityFeatures = await page.evaluate(() => {
      const features = {
        altTexts: Array.from(document.querySelectorAll("img[alt]")).length,
        ariaLabels: Array.from(document.querySelectorAll("[aria-label]")).length,
        headingStructure: Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(
          (h) => h.tagName
        ),
        focusableElements: Array.from(
          document.querySelectorAll("a, button, input, textarea, select")
        ).length,
        skipLinks: Array.from(document.querySelectorAll('a[href^="#"]')).length,
      };
      return features;
    });

    console.log("Accessibility features:", accessibilityFeatures);

    // Check loading performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint:
          performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint")
            ?.startTime || 0,
        resourceCount: performance.getEntriesByType("resource").length,
      };
    });

    console.log("Performance metrics:", performanceMetrics);

    await takeScreenshot(
      page,
      "accessibility-performance",
      "Accessibility and performance check completed"
    );
  });
});

// Create screenshot directory before running tests
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});
