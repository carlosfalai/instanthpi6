const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    console.log("1. Going to https://instanthpi.ca...");
    await page.goto("https://instanthpi.ca", { waitUntil: "networkidle2", timeout: 30000 });

    // Check for login page
    const hasPassword = await page.$('input[type="password"]');
    if (hasPassword) {
      console.log("2. Login page found, entering password...");
      await page.type('input[type="password"]', "InstantHPI2025");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    console.log("3. Navigating to /inbox...");
    await page.goto("https://instanthpi.ca/inbox", { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get page info
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText);
    const bgColor = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor
    );

    console.log("4. Page Analysis:");
    console.log("   - Title:", title);
    console.log("   - Background color:", bgColor);
    console.log("   - Body text length:", bodyText.length);
    console.log('   - Contains "Inbox":', bodyText.includes("Inbox"));
    console.log('   - Contains "conversation":', bodyText.toLowerCase().includes("conversation"));

    // Check for specific elements
    const hasInboxHeader = await page.$("h1");
    const hasConversationList = await page.$$(".cursor-pointer");

    console.log("5. Element Check:");
    console.log("   - Has header:", !!hasInboxHeader);
    console.log("   - Conversation items found:", hasConversationList.length);

    if (bodyText.length < 100) {
      console.log("6. WARNING: Page appears to be blank or not loading properly");
      console.log("   Full body text:", bodyText);
    } else {
      console.log("6. Page appears to be loading with content");
      // Show first 200 characters of content
      console.log("   Preview:", bodyText.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
})();
