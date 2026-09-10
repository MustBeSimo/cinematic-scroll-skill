import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {readFile,access,mkdir} from 'node:fs/promises';
const base=process.env.HOME_PREVIEW_URL||'http://127.0.0.1:8875/';
test('all galleries have linked proximity previews, autoplay and reduced-motion fallbacks',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('#featured-preview').currentTime>.1);
 assert.equal(await page.locator('#featured-preview').evaluate(v=>v.loop&&v.muted),true);
 assert.ok((await page.locator('.hero-media').boundingBox()).height>250,'hero has a visible media frame');
 assert.equal(await page.locator('article [data-gallery-preview]').count(),28);
 assert.equal(await page.locator('article [data-gallery-preview]:not(a[href])').count(),0);
 for(const section of ['flagships','worlds']){
  const cards=page.locator('#'+section+' .project-card');const a=await cards.nth(0).boundingBox();const b=await cards.nth(1).boundingBox();const c=await cards.nth(2).boundingBox();
  assert.ok(Math.abs(a.y-b.y)<2&&b.x>a.x&&c.y>a.y,'two-column layout for '+section);
 }
 await page.locator('.project-prompt summary').first().click();assert.equal(await page.locator('.project-prompt').first().getAttribute('open'),'');
 assert.ok(await page.locator('.project-prompt[open] .copy').isVisible());await page.locator('.project-prompt summary').first().click();
 await page.locator('#project-search').fill('Aureus');assert.equal(await page.locator('.project-card:visible').count(),1);assert.equal(await page.locator('#project-result-count').textContent(),'1 project');
 await page.locator('#project-search').fill('unmatchable-xyz');assert.ok(await page.locator('.project-empty').isVisible());
 await page.locator('#project-search').fill('');assert.equal(await page.locator('.project-card:visible').count(),28);

 const card=page.locator('.world-card').first();await card.scrollIntoViewIfNeeded();await page.waitForTimeout(350);
 const box=await card.boundingBox();await page.mouse.move(box.x-30,box.y+box.height/2);
 await page.waitForFunction(()=>document.querySelector('.world-card video').currentTime>.05);
 assert.notEqual(await card.locator('.gallery-depth').evaluate(el=>getComputedStyle(el).transform),'none');
 await page.locator('.world-card a').first().focus();assert.ok(await page.locator('.world-card a').first().getAttribute('href'));
 const old=await card.locator('.gallery-media').getAttribute('style');await page.evaluate(()=>scrollBy(0,100));await page.waitForTimeout(250);assert.notEqual(await card.locator('.gallery-media').getAttribute('style'),old,'scroll-linked media');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);assert.equal(await page.locator('video').evaluateAll(v=>v.every(e=>e.paused)),true);
 await page.locator('.world-card a').first().click();await page.waitForURL('**/examples/renaissance/');
 await page.goto(base);for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width);}
 await page.goto(new URL('examples/flagships/',base).href);assert.equal(await page.locator('article [data-gallery-preview]').count(),7);
 const first=page.locator('.card a.gallery-link').first();await first.scrollIntoViewIfNeeded();await first.click({position:{x:30,y:80}});await page.waitForURL('**/examples/aureus-flythrough/');
 const still=await browser.newPage({javaScriptEnabled:false});await still.goto(base);assert.equal(await still.locator('.world-card a.gallery-link').count(),21);assert.equal(await still.locator('#featured-preview').evaluate(v=>v.paused),true);await still.close();
 assert.deepEqual(errors,[]);
 await mkdir('.verify/gallery-motion',{recursive:true});await page.goto(base);await page.screenshot({path:'.verify/gallery-motion/home.png'});
});
test('every gallery destination has a local video clip',async()=>{const manifest=JSON.parse(await readFile('assets/previews/manifest.json','utf8'));assert.equal(Object.keys(manifest).length,28);for(const path of Object.values(manifest))await access(path);});
test('agent commands, living artwork and stickers have working static fallbacks',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('[data-art-video]').currentTime>.1);
 const sticker=page.locator('.studio-seal [data-sticker-motion]');const first=await sticker.getAttribute('style');await page.waitForTimeout(200);assert.notEqual(await sticker.getAttribute('style'),first);
 await page.locator('[data-motion-toggle]').click();await page.waitForTimeout(100);assert.equal(await page.locator('video').evaluateAll(v=>v.every(e=>e.paused)),true);assert.equal(await sticker.evaluate(e=>e.style.transform),'none');
 await page.locator('[data-motion-toggle]').click();await page.waitForFunction(()=>!document.querySelector('[data-art-video]').paused);
 await page.locator('#install').scrollIntoViewIfNeeded();await page.waitForTimeout(200);assert.equal(await page.locator('[data-art-video]').evaluate(v=>v.paused),true);
 for(const agent of ['claude-code','cursor','hermes-agent','kimi-code-cli','gemini-cli','openclaw','']){await page.locator(`[data-agent="${agent}"]`).click();assert.equal(await page.locator('#install-command').textContent(),'npx skills add MustBeSimo/cinematic-scroll-skill'+(agent?' --agent '+agent:''));assert.equal(await page.locator('.agent-picker [aria-pressed="true"]').count(),1);}
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);assert.equal(await page.locator('[data-art-video]').evaluate(v=>v.paused),true);assert.equal(await sticker.evaluate(e=>getComputedStyle(e).transform),'none');
 const fallback=await browser.newPage();await fallback.route('**/renaissance-studio-loop.mp4',r=>r.abort());await fallback.goto(base);await fallback.waitForTimeout(300);assert.equal(await fallback.locator('.studio-art-plane img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
});
test('studio navigation works by keyboard, on mobile and without JavaScript',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'light'});await page.goto(base);
 const menu=page.locator('.studio-directory');const summary=menu.locator('summary');
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await menu.getAttribute('open'),'');
 assert.ok(await menu.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'#flagships');
 await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('open'),null);assert.ok(await summary.evaluate(e=>e===document.activeElement));
 await summary.click();await menu.locator('a[href="#worlds"]').click();assert.equal(await menu.getAttribute('open'),null);assert.equal(new URL(page.url()).hash,'#worlds');
 await page.goto(base);await page.mouse.move(900,300);await page.evaluate(()=>scrollTo(0,150));await page.waitForTimeout(200);
 const art=page.locator('.studio-art-plane');assert.ok(!(await art.getAttribute('style')).includes('NaN'));
 await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});await page.waitForTimeout(200);assert.equal(await art.evaluate(e=>getComputedStyle(e).transform),'none');
 await page.setViewportSize({width:390,height:844});await summary.click();assert.ok(await menu.locator('a[href="#install"]').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await plain.goto(base);await plain.locator('.studio-directory summary').click();assert.ok(await plain.locator('.directory-install').isVisible());await plain.locator('.directory-link').first().click();assert.equal(new URL(plain.url()).hash,'#flagships');
});
