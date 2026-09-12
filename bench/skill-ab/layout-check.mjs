// Independent lightweight layout probe (not from the skill): horizontal overflow, clipped text, tiny body text.
import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
const file = process.argv[2];
const exe = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: exe, headless: true });
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(file).href); await page.waitForTimeout(1200);
  // scroll through to trigger reveals, then to top
  await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const iw = innerWidth; const overflowX = document.documentElement.scrollWidth - iw;
    const els = [...document.querySelectorAll("h1,h2,h3,p,li,a,button,span")];
    let clipped = [], small = 0, invisible = 0;
    for (const e of els) {
      const cs = getComputedStyle(e); const t = (e.innerText || "").trim(); if (!t) continue;
      const r = e.getBoundingClientRect();
      if (r.right > iw + 1 || r.left < -1) clipped.push(t.slice(0, 40) + " [viewport]");
      let p = e.parentElement; while (p && p !== document.body) { const pc = getComputedStyle(p); if (/hidden|clip/.test(pc.overflowX + pc.overflowY) ) { const pr = p.getBoundingClientRect(); if (r.right > pr.right + 1 || r.bottom > pr.bottom + 1 || r.left < pr.left - 1) { clipped.push(t.slice(0, 40) + " [parent overflow]"); break; } } p = p.parentElement; }
      if (e.tagName === "P" && parseFloat(cs.fontSize) < 15) small++;
      if (parseFloat(cs.opacity) === 0 && /^(P|H1|H2|H3|LI)$/.test(e.tagName)) invisible++;
    }
    return { overflowX, clipped: [...new Set(clipped)].slice(0, 8), clippedCount: new Set(clipped).size, smallParagraphs: small, invisibleTextAfterScroll: invisible, h1: document.querySelectorAll("h1").length, docHeight: document.body.scrollHeight };
  });
  console.log(`  ${w}px overflowX=${r.overflowX}px clippedText=${r.clippedCount} smallP=${r.smallParagraphs} invisibleTextAfterScroll=${r.invisibleTextAfterScroll} h1=${r.h1} height=${r.docHeight}`);
  for (const c of r.clipped) console.log(`     clipped: ${c}`);
  await ctx.close();
}
await browser.close();
