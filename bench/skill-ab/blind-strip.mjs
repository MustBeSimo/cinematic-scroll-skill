import { chromium } from "playwright-core"; import fs from "node:fs"; import { pathToFileURL } from "node:url";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const fr = [0, 0.2, 0.4, 0.6, 0.8, 1];
for (const label of ["X", "Y", "Z"]) for (const [w, h, tag] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  const page = await ctx.newPage(); await page.goto(pathToFileURL(`blind/${label}.html`).href); await page.waitForTimeout(1000);
  let i = 0; for (const f of fr) {
    await page.evaluate(f => scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * f)), f);
    await page.waitForTimeout(1400); await page.screenshot({ path: `blind/${label}-${tag}-${String(i++).padStart(2, "0")}.png` });
  }
  await ctx.close();
}
await browser.close();
