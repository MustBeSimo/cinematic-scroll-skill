import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

try {
  await page.goto(pathToFileURL(join(here, 'index.html')).href, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const v = [...document.querySelectorAll('video.specimen'), document.querySelector('video.macro-video')];
    return v.every((x) => x && x.readyState >= 1 && x.duration > 0);
  }, { timeout: 6000 });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const geom = await page.evaluate(() => {
    const wrap = document.querySelector('.specimen-wrap').getBoundingClientRect();
    const zoom = document.querySelector('.panel-right').getBoundingClientRect();
    const ow = Math.max(0, Math.min(wrap.right, zoom.right) - Math.max(wrap.left, zoom.left));
    const oh = Math.max(0, Math.min(wrap.bottom, zoom.bottom) - Math.max(wrap.top, zoom.top));
    return { wrapH: wrap.height, vh: innerHeight, overlap: ow * oh, zoomArea: zoom.width * zoom.height,
             hasMacro: !!document.querySelector('video.macro-video') };
  });
  // Full-bleed hero on mobile (not a letterboxed band) and the macro overlays it.
  assert.ok(geom.wrapH >= geom.vh * 0.9, `mobile hero is not full-bleed: ${geom.wrapH} of ${geom.vh}`);
  assert.ok(geom.hasMacro, 'macro optics must use the live video');
  assert.ok(geom.overlap >= geom.zoomArea * 0.8, `macro must overlay the hero: ${geom.overlap}/${geom.zoomArea}`);

  // Scrubbing works on touch, and the macro stays frame-locked to the hero.
  await page.evaluate(() => scrollTo(0, document.querySelector('.hero-track').offsetHeight * 0.5));
  await page.waitForTimeout(1400);
  const s = await page.evaluate(() => ({
    hero: document.querySelector('video.specimen.scan').currentTime,
    macro: document.querySelector('video.macro-video').currentTime,
  }));
  assert.ok(s.hero > 0.8, `mobile scroll did not scrub the video (t=${s.hero})`);
  assert.ok(Math.abs(s.hero - s.macro) < 0.06, `macro drifted from hero by ${Math.abs(s.hero - s.macro)}s`);

  console.log('PASS mobile full-bleed scroll-scrubbed hero with synced macro optics');
} finally {
  await browser.close();
}
