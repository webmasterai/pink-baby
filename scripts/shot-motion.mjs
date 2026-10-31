/**
 * Motion demo recording (Playwright). Local only — no orders/enquiries.
 */
import { mkdirSync, copyFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "tmp-screenshots");
const videoDir = path.join(OUT, "motion-video");
mkdirSync(videoDir, { recursive: true });

const base = process.env.MOTION_BASE || "http://127.0.0.1:3000";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const max = Math.max(document.body.scrollHeight, 2800);
  for (let y = 0; y < max; y += 360) {
    window.scrollTo({ top: y, behavior: "smooth" });
    await sleep(450);
  }
  window.scrollTo({ top: 780, behavior: "instant" });
  await sleep(600);
});

const cards = page.locator(".pb-card-lift").first();
if (await cards.count()) {
  await cards.hover();
  await page.waitForTimeout(500);
}

const add = page.getByRole("button", { name: /Add to cart/i }).first();
if (await add.count()) {
  await add.click();
  await page.waitForTimeout(900);
  const qty = page.getByRole("spinbutton").first();
  if (await qty.count()) {
    await qty.fill("2");
    await page.waitForTimeout(500);
  }
  await page.getByRole("button", { name: /Close cart/i }).first().click();
  await page.waitForTimeout(500);
}

await page.goto(base + "/search", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
await page.waitForTimeout(800);

await page.screenshot({ path: path.join(OUT, "motion-cart.png") });
await context.close();
await browser.close();

for (const name of readdirSync(videoDir).filter((f) => f.endsWith(".webm"))) {
  copyFileSync(path.join(videoDir, name), path.join(OUT, "motion-scroll.webm"));
}
console.log("Wrote tmp-screenshots/motion-scroll.webm and motion-cart.png");
