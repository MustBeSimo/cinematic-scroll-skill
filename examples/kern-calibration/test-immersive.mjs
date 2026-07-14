import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const scrollTrack = (frac) => page.evaluate((f) => {
  document.documentElement.style.scrollBehavior = 'auto';
  scrollTo(0, document.querySelector('.hero-track').offsetHeight * f);
}, frac);

try {
  await page.goto(pathToFileURL(join(here, 'index.html')).href);
  await page.waitForFunction(() => {
    const v = [...document.querySelectorAll('video.specimen')];
    return v.length === 2 && v.every((x) => x.readyState >= 1 && x.duration > 0);
  }, { timeout: 6000 });

  const initial = await page.evaluate(() => {
    const stage = document.querySelector('.specimen-stage').getBoundingClientRect();
    const videos = [...document.querySelectorAll('video.specimen')];
    return {
      stage: { width: stage.width, height: stage.height },
      viewport: { width: innerWidth, height: innerHeight },
      srcs: videos.map((v) => v.currentSrc.split('/').pop()),
      objectFit: getComputedStyle(videos[0]).objectFit,
      baseFilter: getComputedStyle(document.querySelector('.specimen.base')).filter,
    };
  });

  assert.ok(initial.stage.width >= initial.viewport.width * 0.98, `stage width ${initial.stage.width} not immersive`);
  assert.ok(initial.stage.height >= initial.viewport.height * 0.98, `stage height ${initial.stage.height} not immersive`);
  assert.equal(initial.objectFit, 'cover', 'video must cover the immersive stage');
  assert.deepEqual(initial.srcs, ['kern-color.mp4', 'kern-color.mp4'], 'both layers must stream the one scrubbed file');
  assert.ok(/grayscale\(1\)/.test(initial.baseFilter), `base layer must be desaturated in CSS, got ${initial.baseFilter}`);

  // Scrub forward: scrolling the pinned track must advance the shared video time, layers frame-locked.
  await scrollTrack(0.5);
  await page.waitForTimeout(1400);
  const mid = await page.evaluate(() => [...document.querySelectorAll('video.specimen')].map((v) => v.currentTime));
  assert.ok(mid[0] > 0.8, `scroll did not scrub the video forward (t=${mid[0]})`);
  assert.ok(Math.abs(mid[0] - mid[1]) < 0.05, `layers out of sync: ${mid}`);

  // Scrub back: scrolling up must reverse the video (fluid back-and-forth follow).
  await scrollTrack(0.05);
  await page.waitForTimeout(1400);
  const back = await page.evaluate(() => document.querySelector('video.specimen.scan').currentTime);
  assert.ok(back < mid[0] - 0.5, `scroll-up did not reverse the scrub (${back} vs ${mid[0]})`);

  console.log('PASS immersive full-viewport scroll-scrubbed dual-layer contract');
} finally {
  await browser.close();
}
