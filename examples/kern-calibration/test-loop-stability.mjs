import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(pathToFileURL(join(here, 'index.html')).href);
  await page.waitForFunction(() => {
    const v = [...document.querySelectorAll('video.specimen'), document.querySelector('video.macro-video')];
    return v.every((x) => x && x.readyState >= 1 && x.duration > 0);
  }, { timeout: 6000 });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  // Scrub to several positions; at each settle the three layers must share one currentTime and stay decodable.
  const layers = () => page.evaluate(() => {
    const vs = [...document.querySelectorAll('video.specimen'), document.querySelector('video.macro-video')];
    return vs.map((v) => ({ t: v.currentTime, ready: v.readyState }));
  });

  for (const frac of [0.25, 0.6, 0.9, 0.4]) {
    await page.evaluate((f) => scrollTo(0, document.querySelector('.hero-track').offsetHeight * f), frac);
    await page.waitForTimeout(1300);
    const s = await layers();
    const times = s.map((x) => x.t);
    const spread = Math.max(...times) - Math.min(...times);
    assert.ok(spread < 0.06, `layers drifted at ${frac}: ${JSON.stringify(times)}`);
    assert.ok(s.every((x) => x.ready >= 2), `a layer was undecodable at ${frac}: ${JSON.stringify(s)}`);
  }

  console.log('PASS scrubbed layers stay decodable and frame-locked across positions');
} finally {
  await browser.close();
}
