import { test, expect } from "@playwright/test";

test.describe("Doctor Login Focused Test", () => {
  test("Doctor Login and Google Sign-in Analysis", async ({ page }) => {
    console.log("Testing doctor login page in detail...");

    // Navigate to doctor login with proper error handling
    try {
      await page.goto("https://instanthpi.ca/doctor-login");
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "screenshots/doctor-login-detailed.png",
        fullPage: true,
      });

      console.log("✅ Successfully loaded doctor login page");

      // Check page title and URL
      const title = await page.title();
      const url = page.url();
      console.log(`Page Title: ${title}`);
      console.log(`Current URL: ${url}`);

      // Look for all form elements
      const formElements = await page.evaluate(() => {
        const elements = Array.from(
          document.querySelectorAll('input, button, form, [role="button"]')
        );
        return elements.map((el) => ({
          tag: el.tagName,
          type: el.getAttribute("type"),
          id: el.id,
          className: el.className,
          text: el.textContent?.trim(),
          placeholder: el.getAttribute("placeholder"),
          name: el.getAttribute("name"),
          href: el.getAttribute("href"),
        }));
      });

      console.log("All form elements found:");
      formElements.forEach((el, index) => {
        console.log(
          `${index + 1}. ${el.tag} - ${el.text || "No text"} (type: ${el.type}, class: ${el.className})`
        );
      });

      // Specifically look for Google-related elements
      const googleElements = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll("*"));
        return allElements
          .filter((el) => {
            const text = el.textContent?.toLowerCase() || "";
            const className = el.className?.toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";
            const src = el.getAttribute("src")?.toLowerCase() || "";
            const href = el.getAttribute("href")?.toLowerCase() || "";

            return (
              text.includes("google") ||
              className.includes("google") ||
              id.includes("google") ||
              src.includes("google") ||
              href.includes("google") ||
              href.includes("oauth")
            );
          })
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 100),
            className: el.className,
            id: el.id,
            href: el.getAttribute("href"),
            src: el.getAttribute("src"),
          }));
      });

      console.log("Google-related elements:");
      googleElements.forEach((el, index) => {
        console.log(`${index + 1}. ${el.tag} - ${el.text} (href: ${el.href})`);
      });

      // Check for OAuth or authentication redirects
      const authLinks = await page.evaluate(() => {
        const links = Array.from(
          document.querySelectorAll(
            'a[href*="oauth"], a[href*="auth"], a[href*="login"], a[href*="google"]'
          )
        );
        return links.map((link) => ({
          text: link.textContent?.trim(),
          href: link.getAttribute("href"),
          className: link.className,
        }));
      });

      console.log("Authentication links found:", authLinks);

      // Try to click on Google sign-in if found
      if (googleElements.length > 0) {
        const clickableGoogle = googleElements.find(
          (el) => el.tag === "BUTTON" || el.tag === "A" || el.className.includes("button")
        );

        if (clickableGoogle) {
          console.log("Attempting to interact with Google sign-in...");
          try {
            // Try different selection strategies
            const selectors = [
              `#${clickableGoogle.id}`,
              `.${clickableGoogle.className.split(" ")[0]}`,
              'button:has-text("Google")',
              'a:has-text("Google")',
              '[href*="google"]',
              '[href*="oauth"]',
            ].filter(Boolean);

            let clicked = false;
            for (const selector of selectors) {
              try {
                if (await page.$(selector)) {
                  await page.click(selector, { timeout: 5000 });
                  console.log(`✅ Clicked Google sign-in using selector: ${selector}`);
                  clicked = true;

                  // Wait for potential redirect or popup
                  await page.waitForTimeout(3000);

                  const newUrl = page.url();
                  console.log(`URL after click: ${newUrl}`);

                  await page.screenshot({
                    path: "screenshots/after-google-click.png",
                    fullPage: true,
                  });

                  break;
                }
              } catch (e) {
                console.log(`Failed with selector ${selector}: ${e.message}`);
              }
            }

            if (!clicked) {
              console.log("❌ Could not click any Google sign-in element");
            }
          } catch (error) {
            console.log("❌ Error interacting with Google sign-in:", error.message);
          }
        }
      } else {
        console.log("❌ No Google sign-in elements found");
      }

      // Check for any JavaScript errors on the page
      const errors = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      // Check for console messages
      const consoleMessages = [];
      page.on("console", (msg) => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      });

      console.log("Page errors:", errors);
      console.log("Console messages:", consoleMessages.slice(0, 10)); // Limit to first 10
    } catch (error) {
      console.log("❌ Error loading doctor login page:", error.message);

      // Try to take a screenshot even on error
      try {
        await page.screenshot({
          path: "screenshots/doctor-login-error.png",
          fullPage: true,
        });
      } catch (e) {
        console.log("Could not take error screenshot");
      }
    }
  });
});
