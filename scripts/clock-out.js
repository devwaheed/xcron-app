const puppeteer = require("puppeteer");

const EMAIL = "[email]";
const PASSWORD = "[password]";
const LOGIN_URL = "https://paypeople.app/#/login";

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // 1. Go to login
    console.log("Navigating to login…");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    // 2. Fill credentials
    console.log("Filling credentials…");
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="mail"]', { visible: true });
    const emailInput = await page.$('input[type="email"]') || await page.$('input[name="email"]') || await page.$('input[placeholder*="mail"]');
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(EMAIL, { delay: 30 });

    const passwordInput = await page.$('input[type="password"]') || await page.$('input[name="password"]');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(PASSWORD, { delay: 30 });

    // 3. Press login
    console.log("Logging in…");
    const loginBtn = await page.waitForSelector('button[type="submit"]', { visible: true });
    await loginBtn.click();

    // 4. Wait for dashboard
    console.log("Waiting for dashboard…");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => !window.location.hash.includes("login"), { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 3000));

    // 5. Find and click CLOCK OUT
    console.log("Looking for CLOCK OUT button…");

    await page.waitForFunction(
      () => {
        const norm = (t) => (t || "").replace(/[\s\u00A0]+/g, " ").trim().toLowerCase();
        const els = [...document.querySelectorAll("button, a, div[role='button'], span, div")];
        return els.some((el) => {
          const t = norm(el.innerText || el.textContent);
          return t === "clock out" || t === "clockout";
        });
      },
      { timeout: 15000 }
    );

    const clicked = await page.evaluate(() => {
      const norm = (t) => (t || "").replace(/[\s\u00A0]+/g, " ").trim().toLowerCase();
      const els = [...document.querySelectorAll("button, a, div[role='button'], span, div")];
      const matches = els.filter((el) => {
        const t = norm(el.innerText || el.textContent);
        return t === "clock out" || t === "clockout";
      });
      matches.sort((a, b) => (a.innerText || "").length - (b.innerText || "").length);
      if (matches.length > 0) { matches[0].click(); return true; }
      return false;
    });

    if (!clicked) throw new Error("CLOCK OUT button not found on page");
    console.log("Clicked CLOCK OUT");

    // 6. Wait and refresh to verify it changed to CLOCK IN
    await new Promise((r) => setTimeout(r, 4000));
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));

    const verified = await page.evaluate(() => {
      const norm = (t) => (t || "").replace(/[\s\u00A0]+/g, " ").trim().toLowerCase();
      const els = [...document.querySelectorAll("button, a, div[role='button'], span, div")];
      return els.some((el) => {
        const t = norm(el.innerText || el.textContent);
        return t === "clock in" || t === "clockin";
      });
    });

    if (verified) {
      console.log("Verified: button now shows CLOCK IN. Clock out successful.");
    } else {
      console.warn("Warning: could not verify CLOCK IN button after refresh.");
      await page.screenshot({ path: "clock-out-verify-fail.png" });
    }
  } catch (err) {
    console.error("Error:", err.message);
    await page.screenshot({ path: "clock-out-error.png" });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
