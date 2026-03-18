const puppeteer = require("puppeteer");

const EMAIL = "[email]";
const PASSWORD = "[password]";
const LOGIN_URL = "https://paypeople.app/#/login";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // 1. Go to login
    console.log("Navigating to login…");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    // 2. Fill credentials (Angular app — use actual DOM ids)
    console.log("Filling credentials…");
    await page.waitForSelector("#makefocus", { visible: true });
    await new Promise((r) => setTimeout(r, 1000));

    // Clear and fill email
    await page.focus("#makefocus");
    await page.evaluate(() => { document.querySelector("#makefocus").value = ""; });
    await page.type("#makefocus", EMAIL, { delay: 50 });

    // Clear and fill password
    await page.focus("#makefocus2");
    await page.evaluate(() => { document.querySelector("#makefocus2").value = ""; });
    await page.type("#makefocus2", PASSWORD, { delay: 50 });

    // Verify fields were filled
    const filled = await page.evaluate(() => {
      const e = document.querySelector("#makefocus");
      const p = document.querySelector("#makefocus2");
      return { email: e?.value || "EMPTY", pass: p?.value || "EMPTY" };
    });
    console.log("Fields filled:", JSON.stringify(filled));

    // 3. Submit login
    console.log("Logging in…");
    await page.click("button[type='submit'].btn_login");

    // 4. Wait for dashboard (SPA hash change)
    console.log("Waiting for dashboard…");
    await page.waitForFunction(
      () => !window.location.hash.includes("login"),
      { timeout: 60000, polling: 500 }
    );
    console.log("Dashboard loaded, hash:", await page.evaluate(() => window.location.hash));
    await new Promise((r) => setTimeout(r, 5000));

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
