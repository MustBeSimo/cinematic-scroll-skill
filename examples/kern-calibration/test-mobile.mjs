import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

try {
  await page.goto(pathToFileURL(join(here, 'index.html')).href, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => {
    const wrap = document.querySelector('.specimen-wrap').getBoundingClientRect();
    const zoom = document.querySelector('.panel-right').getBoundingClientRect();
    const videos = [...document.querySelectorAll('video.specimen')];
    const overlapWidth = Math.max(0, Math.min(wrap.right, zoom.right) - Math.max(wrap.left, zoom.left));
    const overlapHeight = Math.max(0, Math.min(wrap.bottom, zoom.bottom) - Math.max(wrap.top, zoom.top));
    return {
      wrap: { top: wrap.top, right: wrap.right, bottom: wrap.bottom, left: wrap.left },
      zoom: { top: zoom.top, right: zoom.right, bottom: zoom.bottom, left: zoom.left, area: zoom.width * zoom.height },
      overlapArea: overlapWidth * overlapHeight,
      videos: videos.map((video) => ({
        paused: video.paused,
        readyState: video.readyState,
        currentTime: video.currentTime,
      })),
    };
  });

  for (const video of state.videos) {
    assert.equal(video.paused, false, 'mobile hero video must autoplay');
    assert.ok(video.readyState >= 2, `mobile hero video is not decodable: readyState ${video.readyState}`);
  }
  assert.ok(state.overlapArea >= state.zoom.area * 0.8, `macro optics must visually share the mobile hero: overlap ${state.overlapArea}/${state.zoom.area}`);

  const before = state.videos.map((video) => video.currentTime);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => [...document.querySelectorAll('video.specimen')].map((video) => video.currentTime));
  assert.ok(after[0] - before[0] > 0.5, 'mobile monochrome video did not advance');
  assert.ok(after[1] - before[1] > 0.5, 'mobile colour video did not advance');

  console.log('PASS mobile autoplay and integrated macro-optics contract');
} finally {
  await browser.close();
}
