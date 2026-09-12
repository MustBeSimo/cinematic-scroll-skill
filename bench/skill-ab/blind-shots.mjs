import { chromium } from "playwright-core"; import fs from "node:fs"; import { pathToFileURL } from "node:url";
const map = JSON.parse(fs.readFileSync("blind-map.json", "utf8")); // {A:"X",...}
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const [cond, label] of Object.entries(map)) {
  fs.copyFileSync(`builds/${cond}/index.html`, `blind/${label}.html`);
  for (const [w, h, tag] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    const page = await ctx.newPage(); await page.goto(pathToFileURL(`blind/${label}.html`).href); await page.waitForTimeout(1000);
    await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } scrollTo(0, 0); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `blind/${label}-${tag}-fold.png` });
    await page.screenshot({ path: `blind/${label}-${tag}-full.png`, fullPage: true });
    await ctx.close();
  }
}
await browser.close(); console.log("shots done");
