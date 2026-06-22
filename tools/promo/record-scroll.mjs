#!/usr/bin/env node
/**
 * record-scroll.mjs <file.html> <outName> [--w 1920 --h 1080 --scroll 6000 --hold 900]
 *
 * Records a REAL scroll-through of a page (headless Chrome screencast via playwright-core):
 * loads it, holds on the hero, smoothly eases scroll top→bottom, holds, saves webm → mp4.
 * This captures actual parallax/reveal/pin animation — not a slideshow of stills.
 *
 * Output: .promo/rec/<outName>.mp4
 */
import { chromium } from "playwright-core";
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const file = args[0], outName = args[1];
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i !== -1 ? Number(args[i + 1]) : d; };
if (!file || !outName) { console.error("usage: record-scroll.mjs <file.html> <outName> [--w --h --scroll --hold]"); process.exit(1); }
const W = opt("w", 1920), H = opt("h", 1080), SCROLL = opt("scroll", 6000), HOLD = opt("hold", 900);

const exe = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const recDir = join(ROOT, ".promo/rec/_raw");
mkdirSync(recDir, { recursive: true });
const outDir = join(ROOT, ".promo/rec");

const browser = await chromium.launch({ executablePath: exe, args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"] });
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1,
  recordVideo: { dir: recDir, size: { width: W, height: H } },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const url = pathToFileURL(resolve(ROOT, file)).href;
await page.goto(url, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1800);                 // fonts + first paint + hero settle
const video = page.video();

// Drive scroll with REAL wheel events — this is what Lenis / GSAP ScrollSmoother /
// ScrollTrigger actually respond to (window.scrollTo is ignored under smooth-scroll
// hijacking). Pace the wheel over SCROLL ms so the page's own easing stays smooth.
await page.mouse.move(W / 2, H / 2);
const distance = await page.evaluate(() => Math.max(
  document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight);
const steps = Math.max(80, Math.round(SCROLL / 34));   // ~30 ticks/sec
const per = (distance * 1.12) / steps;                 // slight over-scroll → reaches the end
const dt = SCROLL / steps;
for (let i = 0; i < steps; i++) {
  await page.mouse.wheel(0, per);
  await page.waitForTimeout(dt);
}
await page.waitForTimeout(HOLD);                  // hold on the final frame
await ctx.close();
await browser.close();

const raw = await video.path();
const out = join(outDir, `${outName}.mp4`);
const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-vf", `scale=${W}:${H},fps=30,format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", out], { encoding: "utf8" });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
if (existsSync(raw)) rmSync(raw, { force: true });
console.log(`✓ recorded scroll → ${out.replace(ROOT + "/", "")}`);
