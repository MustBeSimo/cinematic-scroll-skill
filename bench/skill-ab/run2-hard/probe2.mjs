// Independent runtime probe for run 2. usage: node probe2.mjs <url> <outdir>
// Modes: normal, reduced-motion, no-js, no-webgl. Reports uncaught errors, console errors,
// failed requests, overflow/clipped text at 390 & 1440, and a hero screenshot per mode.
import { chromium } from "playwright-core"; import fs from "node:fs";
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const exe = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const GL=["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"];
const all = { normal: { args: GL }, "reduced-motion": { reducedMotion: "reduce", args: GL }, "reduced-motion": { reducedMotion: "reduce" }, "no-js": { javaScriptEnabled: false, args: GL }, "no-webgl": { args: ["--disable-webgl", "--disable-3d-apis"] } };
const modes = process.env.PROBE_MODES ? Object.fromEntries(process.env.PROBE_MODES.split(",").map(m=>[m,all[m]])) : all;
const res = {};
for (const [mode, opt] of Object.entries(modes)) {
  const browser = await chromium.launch({ executablePath: exe, headless: true, args: opt.args || [] });
  res[mode] = {};
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, reducedMotion: opt.reducedMotion, javaScriptEnabled: opt.javaScriptEnabled !== false });
    const page = await ctx.newPage(); const errs = [], cons = [], failed = [];
    page.on("pageerror", e => errs.push(String(e.message).slice(0, 160)));
    page.on("console", m => { if (m.type() === "error") cons.push(m.text().slice(0, 160)); });
    page.on("requestfailed", r => failed.push(r.url().split("/").slice(-2).join("/") + " " + (r.failure()?.errorText || "")));
    page.on("response", r => { if (r.status() >= 400) failed.push(r.url().split("/").slice(-2).join("/") + " " + r.status()); });
    try { await page.goto(url, { waitUntil: "load", timeout: 30000 }); } catch (e) { errs.push("goto: " + e.message.slice(0, 100)); }
    await page.waitForTimeout(9000);
    await page.screenshot({ path: `${out}/${mode}-${w}-hero.png` });
    const steps = 8; for (let i = 1; i <= steps; i++) { await page.evaluate((f) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), i / steps); await page.waitForTimeout(700); if (i === 3 || i === 6) await page.screenshot({ path: `${out}/${mode}-${w}-s${i}.png` }); }
    const lay = await page.evaluate(() => {
      const iw = innerWidth; const overflowX = document.documentElement.scrollWidth - iw; let clipped = 0, hidden = 0, textNodes = 0;
      for (const e of document.querySelectorAll("h1,h2,h3,p,li,a,button")) { const t = (e.innerText || "").trim(); if (!t) continue; textNodes++; const r = e.getBoundingClientRect(); if (r.width && (r.right > iw + 1 || r.left < -1)) clipped++; const cs = getComputedStyle(e); if (parseFloat(cs.opacity) === 0 || cs.visibility === "hidden") hidden++; }
      return { overflowX, clipped, hiddenTextAtEnd: hidden, textNodes, hasCanvas: !!document.querySelector("canvas"), h1: document.querySelectorAll("h1").length };
    }).catch(e => ({ evalError: e.message.slice(0, 80) }));
    res[mode][w] = { uncaught: errs, consoleErrors: cons, failedRequests: [...new Set(failed)], ...lay };
    await ctx.close();
  }
  await browser.close();
}
fs.writeFileSync(`${out}/probe.json`, JSON.stringify(res, null, 2));
for (const [m, v] of Object.entries(res)) for (const [w, r] of Object.entries(v)) console.log(`  ${m.padEnd(15)} ${w}px uncaught=${r.uncaught?.length} consoleErr=${r.consoleErrors?.length} failedReq=${r.failedRequests?.length} overflowX=${r.overflowX} clipped=${r.clipped} hiddenText=${r.hiddenTextAtEnd}/${r.textNodes} canvas=${r.hasCanvas}`);
