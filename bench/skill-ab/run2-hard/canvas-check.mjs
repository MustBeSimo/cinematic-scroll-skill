import { chromium } from "playwright-core";
const [url] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
const logs = []; page.on("console", m => logs.push(m.type() + ": " + m.text().slice(0, 120))); page.on("pageerror", e => logs.push("PAGEERROR: " + e.message.slice(0, 120)));
await page.goto(url); await page.waitForTimeout(10000);
const r = await page.evaluate(() => {
  const cs = [...document.querySelectorAll("canvas")].map(c => { const r = c.getBoundingClientRect(); const s = getComputedStyle(c); let gl = null; try { gl = c.getContext("webgl2") || c.getContext("webgl"); } catch {} return { w: Math.round(r.width), h: Math.round(r.height), display: s.display, opacity: s.opacity, visibility: s.visibility, hasGL: !!gl, drawingW: c.width }; });
  const poster = [...document.querySelectorAll("img,svg,[class*=poster],[id*=poster]")].filter(e => /poster/i.test(e.className + e.id + (e.getAttribute("src") || ""))).map(e => { const s = getComputedStyle(e); return { tag: e.tagName, display: s.display, opacity: s.opacity }; });
  return { canvases: cs, poster, htmlClass: document.documentElement.className, bodyClass: document.body.className };
});
console.log(JSON.stringify(r)); console.log(logs.slice(0, 8).join("\n")); await b.close();
