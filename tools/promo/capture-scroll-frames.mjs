#!/usr/bin/env node
/**
 * capture-scroll-frames.mjs <file.html> <outDir> [--w 1920 --h 1080 --from .02 --to .60 --frames 54]
 *
 * Deterministic smooth scroll-through: the themed components animate as a function of
 * window.scrollY (vanilla rAF, no Lenis), so stepping scrollY 0→max and screenshotting each
 * step yields a perfectly smooth, controllable scroll clip — real parallax/reveal motion,
 * no library-hijack issues. Frames → outDir/f-####.png (assemble at 30fps elsewhere).
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const a = process.argv.slice(2);
const file = a[0], outDir = resolve(ROOT, a[1]);
const num = (k, d) => { const i = a.indexOf(`--${k}`); return i !== -1 ? Number(a[i + 1]) : d; };
const W = num("w", 1920), H = num("h", 1080), FROM = num("from", 0.02), TO = num("to", 0.60), N = num("frames", 54);
if (!file || !a[1]) { console.error("usage: capture-scroll-frames.mjs <file> <outDir> [--w --h --from --to --frames]"); process.exit(1); }

mkdirSync(outDir, { recursive: true });
const exe = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: exe, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
const page = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: "no-preference" }).then((c) => c.newPage());
await page.goto(pathToFileURL(resolve(ROOT, file)).href, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1800);                                 // fonts + first paint
const max = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight);

for (let i = 0; i < N; i++) {
  const frac = FROM + (TO - FROM) * (i / (N - 1));              // linear → steady scroll feel
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(frac * max));
  await page.waitForTimeout(45);                                // let the rAF parallax settle
  await page.screenshot({ path: join(outDir, `f-${String(i).padStart(4, "0")}.png`) });
}
await browser.close();
console.log(`✓ ${N} scroll frames → ${outDir.replace(ROOT + "/", "")}`);
