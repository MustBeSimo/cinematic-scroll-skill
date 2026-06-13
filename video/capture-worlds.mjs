/**
 * capture-worlds.mjs — record smooth scroll footage of the example pages
 *
 * Drives each examples/<world>/index.html through a single eased top→bottom
 * scroll in a real Chromium, recording 1920×1080 video. Output webm clips are
 * transcoded to mp4 (yuv420p, H.264) for Remotion's <OffthreadVideo>.
 *
 *   node video/capture-worlds.mjs                 # all worlds
 *   node video/capture-worlds.mjs noir luxe       # subset
 *
 * Footage lands in video/footage/<world>.mp4
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'footage');
const RAW = join(OUT, '_raw');

// World → seconds for the FULL top→bottom scroll. Kept short so the reel can
// show the ENTIRE page travel (hero → every chapter → footer) inside one ~4.6s
// shot — the page rushing past is the dynamism. Pins become brief holds within
// the rush, not long static dwells. Glacial worlds (luxe) get a touch longer.
const WORLDS = {
  renaissance: 5,
  studio: 4.5,
  noir: 5,
  luxe: 6,
  pop: 4.5,
  atelier: 5,
};

// Fraction of the page to skip before the captured scroll begins. Used to jump
// past a long pinned hero so the clip spends its time in the dynamic, chapter-
// to-chapter zone (more reveals/transitions). 0 = start at the very top.
const START_FRAC = {
  // noir's hero is its strongest, most iconic frame; the rest of the page is
  // intentional negative space — so it captures best from the top.
};

const W = 1920;
const H = 1080;
const HOLD_TOP = 300;      // ms held at the hero before the scroll begins
const HOLD_BOTTOM = 400;   // ms held on the final frame

const pick = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const targets = pick.length ? pick : Object.keys(WORLDS);

mkdirSync(OUT, { recursive: true });

async function capture(world) {
  const scrollSeconds = WORLDS[world] ?? 9;
  const page404 = `examples/${world}/index.html`;
  const url = 'file://' + join(ROOT, page404);
  rmSync(RAW, { recursive: true, force: true });
  mkdirSync(RAW, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-gpu-vsync'],
  });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  // Let fonts, images, and ScrollTrigger init settle before recording motion.
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(400);
  const startFrac = START_FRAC[world] ?? 0;
  await page.evaluate((f) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    window.scrollTo(0, f * max);
  }, startFrac);
  await page.waitForTimeout(HOLD_TOP);

  // Constant-velocity top→bottom pass. Linear (not eased) so motion is present
  // in EVERY frame — no slow ramps that read as static. A tiny ease only on the
  // first/last 8% softens the start/stop without killing mid-scroll travel.
  await page.evaluate(async ({durMs, from}) => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const ramp = (t) => (t < 0.08 ? (t / 0.08) * 0.04 + t * 0.96
                       : t > 0.92 ? 1 - ((1 - t) / 0.08) * 0.04 - (1 - t) * 0.96
                       : t);
    const t0 = performance.now();
    await new Promise((done) => {
      const step = (now) => {
        const p = Math.min(1, (now - t0) / durMs);
        const pos = from + (1 - from) * ramp(p);
        window.scrollTo(0, pos * max);
        p < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
  }, {durMs: scrollSeconds * 1000, from: startFrac});

  await page.waitForTimeout(HOLD_BOTTOM);

  // recordVideo finalizes the file only on context close.
  await context.close();
  await browser.close();

  // Grab the single webm Playwright just wrote and transcode → mp4.
  const webm = readdirSync(RAW).find((f) => f.endsWith('.webm'));
  if (!webm) throw new Error(`no video recorded for ${world}`);
  const src = join(RAW, webm);
  const dest = join(OUT, `${world}.mp4`);

  // Trim to exactly the scroll segment. Measured back from the END (only the
  // fixed bottom-hold follows the scroll), so it's robust to variable page
  // load/settle time at the head. A small inset trims the start jerk + hold.
  const probed = +execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', src,
  ]).toString().trim();
  const inset = 0.15;
  const segDur = Math.max(1, scrollSeconds - inset);
  const segStart = Math.max(0, probed - HOLD_BOTTOM / 1000 - scrollSeconds + inset);

  execFileSync('ffmpeg', [
    '-y', '-ss', segStart.toFixed(3), '-t', segDur.toFixed(3), '-i', src,
    '-vf', `scale=${W}:${H}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-crf', '17', '-preset', 'slow',
    '-movflags', '+faststart',
    dest,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  rmSync(RAW, { recursive: true, force: true });

  const dur = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', dest,
  ]).toString().trim();
  console.log(`✓ ${world.padEnd(12)} → footage/${world}.mp4  (${(+dur).toFixed(1)}s)`);
}

console.log(`Capturing ${targets.length} world(s) at ${W}×${H}…\n`);
for (const world of targets) {
  if (!(world in WORLDS)) { console.warn(`! skip unknown world: ${world}`); continue; }
  try { await capture(world); }
  catch (e) { console.error(`✗ ${world}: ${e.message}`); }
}
console.log(`\nDone. Footage in ${OUT}`);
