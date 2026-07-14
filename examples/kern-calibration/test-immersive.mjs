import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(pathToFileURL(join(here, 'index.html')).href);
  await page.waitForFunction(() => [...document.querySelectorAll('video.specimen')].every((video) => video.readyState >= 2 && !video.paused), { timeout: 5000 });

  const initial = await page.evaluate(() => {
    const stage = document.querySelector('.specimen-stage');
    const videos = [...document.querySelectorAll('video.specimen')];
    const rect = stage.getBoundingClientRect();
    return {
      stage: { width: rect.width, height: rect.height },
      viewport: { width: innerWidth, height: innerHeight },
      videos: videos.map((video) => ({
        currentTime: video.currentTime,
        paused: video.paused,
        muted: video.muted,
        loop: video.loop,
        playsInline: video.playsInline,
        objectFit: getComputedStyle(video).objectFit,
        readyState: video.readyState,
      })),
      mask: getComputedStyle(videos[1]).maskImage !== 'none'
        ? getComputedStyle(videos[1]).maskImage
        : getComputedStyle(videos[1]).webkitMaskImage,
      bloom: getComputedStyle(videos[1]).getPropertyValue('--b0').trim(),
    };
  });

  assert.ok(initial.mask.includes('radial-gradient'), 'colour video must carry the radial bloom mask');
  assert.equal(parseFloat(initial.bloom), 0, `blooms must start closed, got ${initial.bloom}`);

  assert.ok(initial.stage.width >= initial.viewport.width * 0.98, `stage width ${initial.stage.width}px is not immersive`);
  assert.ok(initial.stage.height >= initial.viewport.height * 0.98, `stage height ${initial.stage.height}px is not immersive`);
  for (const video of initial.videos) {
    assert.equal(video.paused, false, 'video must autoplay');
    assert.equal(video.muted, true, 'video must be muted for autoplay');
    assert.equal(video.loop, true, 'video must loop');
    assert.equal(video.playsInline, true, 'video must play inline');
    assert.equal(video.objectFit, 'cover', 'video must cover the immersive stage');
    assert.ok(video.readyState >= 2, `video readyState ${video.readyState} is not decodable`);
  }

  const t0 = initial.videos.map((video) => video.currentTime);
  await page.waitForTimeout(1000);
  const t1 = await page.evaluate(() => [...document.querySelectorAll('video.specimen')].map((video) => video.currentTime));
  assert.ok(t1[0] - t0[0] > 0.7, 'monochrome video did not visibly advance');
  assert.ok(t1[1] - t0[1] > 0.7, 'colour video did not visibly advance');
  assert.ok(Math.abs(t1[0] - t1[1]) < 0.08, `video drift ${Math.abs(t1[0] - t1[1])}s exceeds boundary tolerance`);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, document.querySelector('.hero-track').offsetHeight * 0.48);
  });
  await page.waitForTimeout(500);
  const revealed = await page.evaluate(() => getComputedStyle(document.querySelector('video.specimen.scan')).getPropertyValue('--b0').trim());
  assert.notEqual(revealed, initial.bloom, 'scroll must open the colour blooms');
  assert.ok(parseFloat(revealed) > 0, `bloom radius ${revealed} did not grow on scroll`);

  console.log('PASS immersive full-viewport dual-video contract');
} finally {
  await browser.close();
}
