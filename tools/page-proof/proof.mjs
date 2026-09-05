#!/usr/bin/env node
/**
 * page-proof — runtime evidence for a cinematic build.
 *
 * The doctor (tools/cinematic-doctor) grades the static contract; page-proof
 * answers the question the doctor can't: does the page actually RUN — no
 * console errors, no dead canvas — and what does it LOOK like at each scroll
 * depth? It opens the page in headless Chromium, scrolls through it, collects
 * every console error / pageerror / failed request, and writes screenshots an
 * agent (or a human) can eyeball.
 *
 *   node tools/page-proof/proof.mjs <url-or-file> [options]
 *     --shots 0,0.33,0.66,1     scroll fractions to screenshot (default)
 *     --out <dir>               output dir (default .page-proof/)
 *     --wait <ms>               settle time per shot (default 1200; use
 *                               6000+ for WebGL pages under software GL)
 *     --viewport 1440x900       viewport size
 *     --fps                     measure scroll smoothness: drives a steady
 *                               6s scroll on rAF and reports avg fps + the
 *                               share of dropped frames (>34ms). DOM pages
 *                               only — headless software-GL makes WebGL fps
 *                               unrepresentative; measure those in a real
 *                               browser.
 *     --browser <path>          Chromium/Chrome executable. Auto-detected from
 *                               $CHROME_PATH, Playwright/Puppeteer caches, and
 *                               common system locations.
 *
 * Exit code: 0 = ran clean · 1 = runtime errors found · 2 = could not run.
 * Report: <out>/proof.json  { url, errors[], shots[], verdict }.
 *
 * Requires `playwright-core` (npm i -D playwright-core) + any Chrome/Chromium.
 * Media/codec notes: open-source Chromium builds skip H.264 — an mp4 that
 * aborts here may be fine in branded Chrome; the report flags these as `media`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectLayout } from './layout.mjs';

const args = process.argv.slice(2);
if (!args.length || args[0].startsWith('--')) {
  console.error('usage: node tools/page-proof/proof.mjs <url-or-file> [--shots 0,0.5,1] [--out dir] [--wait ms] [--viewport WxH] [--browser path]');
  process.exit(2);
}
const target = args[0];
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i > -1 && args[i + 1] ? args[i + 1] : dflt;
};
const SHOTS = opt('shots', '0,0.33,0.66,1').split(',').map(Number);
const OUT = path.resolve(opt('out', '.page-proof'));
const WAIT = Number(opt('wait', 1200));
const [VW, VH] = opt('viewport', '1440x900').split('x').map(Number);
const REDUCED = args.includes('--reduced-motion');
const MOBILE = args.includes('--mobile');
const NO_JS = args.includes('--no-js');
if (!SHOTS.length || SHOTS.some(f => !Number.isFinite(f) || f < 0 || f > 1) ||
    !Number.isFinite(WAIT) || WAIT < 0 || WAIT > 60000 ||
    ![VW, VH].every(v => Number.isInteger(v) && v > 0 && v <= 8192)) {
  console.error('page-proof: invalid shots, wait, or viewport');
  process.exit(2);
}

function findBrowser() {
  const explicit = opt('browser', process.env.CHROME_PATH);
  const candidates = [explicit];
  // Playwright + Puppeteer caches (newest first), then system installs
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(process.env.HOME || '', '.cache/ms-playwright')]) {
    if (root && fs.existsSync(root)) {
      for (const d of fs.readdirSync(root).sort().reverse()) {
        candidates.push(path.join(root, d, 'chrome-linux', 'chrome'));
        candidates.push(path.join(root, d, 'chrome-linux64', 'chrome'));
      }
    }
  }
  const pup = path.join(process.env.HOME || '', '.cache/puppeteer/chrome');
  if (fs.existsSync(pup)) {
    for (const d of fs.readdirSync(pup).sort().reverse()) {
      candidates.push(path.join(pup, d, 'chrome-linux64', 'chrome'));
    }
  }
  candidates.push(
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  return candidates.find((c) => c && fs.existsSync(c));
}

const exe = findBrowser();
if (!exe) {
  console.error('page-proof: no Chrome/Chromium found. Set $CHROME_PATH or pass --browser <path>.');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('page-proof: playwright-core not installed. Run: npm i -D playwright-core');
  process.exit(2);
}

const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
fs.mkdirSync(OUT, { recursive: true });

let browser;
let page;
try {
  browser = await chromium.launch({
    executablePath: exe,
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  page = await browser.newPage({
    viewport: { width: VW, height: VH }, hasTouch: MOBILE, isMobile: MOBILE,
    reducedMotion: REDUCED ? 'reduce' : 'no-preference', javaScriptEnabled: !NO_JS,
  });
} catch (error) {
  if (browser) await browser.close();
  const report = { url, verdict: 'INCOMPLETE', errors: [{ kind: 'environment', text: error.message }], shots: [] };
  fs.writeFileSync(path.join(OUT, 'proof.json'), JSON.stringify(report, null, 2));
  console.error('page-proof: could not launch browser: ' + error.message);
  process.exit(2);
}

const errors = [];
const push = (kind, text) => {
  const entry = { kind, text: String(text).slice(0, 300) };
  // Seeking may intentionally abort a media request. Missing/failed media still fails.
  if (/\.(mp4|webm|m4v)(?:[?\s]|$)/i.test(entry.text) && /ERR_ABORTED/.test(entry.text) && kind === 'request') entry.kind = 'media';
  if (errors.some(e => e.kind === entry.kind && e.text === entry.text)) return;
  errors.push(entry);
};
page.on('console', (m) => { if (m.type() === 'error') push('console', m.text()); });
page.on('pageerror', (e) => push('pageerror', e.message));
page.on('requestfailed', (r) => push('request', `${r.url()} ${r.failure()?.errorText ?? ''}`));
page.on('response', (r) => { if (r.status() >= 400) push('http', `${r.status()} ${r.url()}`); });

const MEASURE_FPS = args.includes('--fps');

const shots = [];
let fps = null;
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(Math.max(WAIT, 1200));

  if (MEASURE_FPS) {
    // Drive a steady real-time scroll for ~6s and sample rAF deltas — the
    // budget says transform/opacity-only hot paths, so frames > 34ms (two
    // missed vsyncs at 60 Hz) count as jank.
    fps = await page.evaluate(() => new Promise((resolve) => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const DURATION = 6000;
      const t0 = performance.now();
      let last = t0;
      const deltas = [];
      function frame(now) {
        deltas.push(now - last);
        last = now;
        const p = Math.min(1, (now - t0) / DURATION);
        window.scrollTo(0, p * max);
        if (p < 1) requestAnimationFrame(frame);
        else {
          deltas.shift(); // first delta spans setup
          const avgMs = deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);
          const long = deltas.filter((d) => d > 34).length;
          resolve({
            avgFps: Math.round(1000 / avgMs),
            frames: deltas.length,
            droppedPct: Math.round((long / Math.max(1, deltas.length)) * 100),
            worstMs: Math.round(Math.max(...deltas)),
          });
        }
      }
      requestAnimationFrame(frame);
    }));
    console.log(`fps: avg ${fps.avgFps} · dropped ${fps.droppedPct}% · worst frame ${fps.worstMs}ms (${fps.frames} frames)`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  for (const f of SHOTS) {
    await page.evaluate((fr) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo(0, fr * Math.max(0, max));
    }, f);
    await page.waitForTimeout(WAIT);
    if (args.includes('--check-layout')) {
      const findings = await page.evaluate(inspectLayout, { checkHeadings: NO_JS || REDUCED });
      for (const finding of findings) push('layout', `scroll=${f}: ${finding}`);
    }
    const file = path.join(OUT, `shot-${String(Math.round(f * 100)).padStart(3, '0')}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    console.log('shot', file);
  }
} catch (e) {
  push('navigation', e.message);
}
await browser.close();

const hard = errors.filter((e) => e.kind !== 'media');
const verdict = hard.length === 0 ? 'CLEAN' : 'ERRORS';
const report = { url, viewport: `${VW}x${VH}`, reducedMotion: REDUCED, mobile: MOBILE,
  javaScript: !NO_JS, verdict, errors, shots, ...(fps ? { fps } : {}) };
fs.writeFileSync(path.join(OUT, 'proof.json'), JSON.stringify(report, null, 2));

console.log(`\npage-proof: ${verdict} — ${hard.length} runtime error(s), ${errors.length - hard.length} media advisories, ${shots.length} shot(s)`);
for (const e of hard.slice(0, 10)) console.log(`  [${e.kind}] ${e.text}`);
console.log(`report → ${path.join(OUT, 'proof.json')}`);
process.exit(hard.length ? 1 : 0);
