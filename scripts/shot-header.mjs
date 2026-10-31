import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1000);
const logo = page.locator('header img[alt="Pink Baby"]').first();
console.log("logo src", await logo.getAttribute("src"));
await page.screenshot({
  path: "tmp-screenshots/match-desktop-header.png",
  clip: { x: 0, y: 0, width: 1440, height: 240 },
});
await browser.close();
