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
  await page.evaluate(async () => {
    const videos = [...document.querySelectorAll('video.specimen')];
    const target = Math.max(0, Math.min(...videos.map((video) => video.duration)) - 0.45);
    videos.forEach((video) => { video.currentTime = target; });
    await Promise.all(videos.map((video) => video.play()));
  });

  const samples = [];
  for (let i = 0; i < 10; i += 1) {
    await page.waitForTimeout(200);
    samples.push(await page.evaluate(() => [...document.querySelectorAll('video.specimen')].map((video) => ({
      readyState: video.readyState,
      paused: video.paused,
      seeking: video.seeking,
      currentTime: video.currentTime,
    }))));
  }

  for (let videoIndex = 0; videoIndex < 2; videoIndex += 1) {
    let streak = 0;
    let longestStreak = 0;
    for (const sample of samples) {
      const video = sample[videoIndex];
      assert.equal(video.paused, false, 'video paused across loop boundary');
      streak = video.readyState < 2 ? streak + 1 : 0;
      longestStreak = Math.max(longestStreak, streak);
    }
    assert.ok(longestStreak <= 2, `video remained undecodable across loop: ${JSON.stringify(samples)}`);
    assert.ok(samples.at(-1)[videoIndex].readyState >= 2, 'video did not recover after loop boundary');
  }
  const last = samples.at(-1);
  const duration = await page.evaluate(() => document.querySelector('video.specimen').duration);
  const raw = Math.abs(last[0].currentTime - last[1].currentTime);
  const drift = Math.min(raw, duration - raw);
  assert.ok(drift < 0.12, `loop-boundary drift ${drift}s exceeds tolerance`);

  console.log('PASS dual-video loop remains decodable and synchronized');
} finally {
  await browser.close();
}
