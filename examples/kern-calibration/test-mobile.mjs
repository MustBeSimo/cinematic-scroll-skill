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
    const macroVideo = document.querySelector('video.macro-video');
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
      macroVideo: macroVideo && {
        paused: macroVideo.paused,
        readyState: macroVideo.readyState,
        currentTime: macroVideo.currentTime,
        duration: macroVideo.duration,
      },
    };
  });

  for (const video of state.videos) {
    assert.equal(video.paused, false, 'mobile hero video must autoplay');
    assert.ok(video.readyState >= 2, `mobile hero video is not decodable: readyState ${video.readyState}`);
  }
  assert.ok(state.overlapArea >= state.zoom.area * 0.8, `macro optics must visually share the mobile hero: overlap ${state.overlapArea}/${state.zoom.area}`);
  assert.ok(state.macroVideo, 'macro optics must use the live mechanical video, not a static image crop');
  assert.equal(state.macroVideo.paused, false, 'macro optics video must autoplay');
  assert.ok(state.macroVideo.readyState >= 2, `macro optics video is not decodable: readyState ${state.macroVideo.readyState}`);

  const before = state.videos.map((video) => video.currentTime);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    hero: [...document.querySelectorAll('video.specimen')].map((video) => video.currentTime),
    macro: document.querySelector('video.macro-video').currentTime,
  }));
  assert.ok(after.hero[0] - before[0] > 0.5, 'mobile monochrome video did not advance');
  assert.ok(after.hero[1] - before[1] > 0.5, 'mobile colour video did not advance');
  assert.ok(after.macro - state.macroVideo.currentTime > 0.5, 'mobile macro optics video did not advance');
  const drift = Math.abs(after.hero[0] - after.macro);
  const circularDrift = Math.min(drift, state.macroVideo.duration - drift);
  assert.ok(circularDrift < 0.12, `macro optics drifted from the hero by ${circularDrift.toFixed(3)}s`);

  console.log('PASS mobile autoplay and integrated macro-optics contract');
} finally {
  await browser.close();
}
