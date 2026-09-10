import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

test('all v3 studies preserve font pairing, live system colors and narrow-screen layout', async t => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  t.after(() => browser.close());
  const staticURL = process.env.V3_STATIC_URL || 'http://127.0.0.1:8765';
  const reactURL = process.env.V3_URL || 'http://127.0.0.1:8766';
  for (const [url, root] of [
    [staticURL + '/examples/effects-lab/', 'body'],
    [staticURL + '/examples/v3-flagship/', 'body'],
    [reactURL + '/effects-lab', '.v3-lab'],
    [reactURL + '/v3-flagship', '.v3-lab'],
  ]) {
    // The static composition must satisfy these properties without enhancement.
    const page = await browser.newPage({ javaScriptEnabled: false, colorScheme: 'light', viewport: { width: 1440, height: 1000 } });
    await page.goto(url);
    const measure = () => page.evaluate(selector => {
      const surface = document.querySelector(selector);
      const style = getComputedStyle(surface);
      return {
        background: style.backgroundColor,
        bodyFont: style.fontFamily,
        headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        overflowing: [...document.querySelectorAll('main *,header *,footer *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,8).map(el => el.tagName + '.' + el.className),
      };
    }, root);
    const light = await measure();
    assert.match(light.bodyFont, /sans-serif/, url);
    assert.match(light.headingFont, /Georgia|Instrument Serif/, url);
    assert.notEqual(light.bodyFont, light.headingFont, url);
    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await measure();
    assert.notEqual(light.background, dark.background, url + ' responds to a live preference change');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const current = await measure();
      assert.equal(current.overflow, false, url + ' at ' + width + ': ' + current.overflowing.join(', '));
    }
    await page.close();
  }
});
