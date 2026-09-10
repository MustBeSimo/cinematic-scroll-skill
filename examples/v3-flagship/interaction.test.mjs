import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const url=process.env.FIELD_URL||pathToFileURL(resolve('examples/v3-flagship/index.html')).href;
test('FIELD iris is usable with keyboard, paused motion, reduced motion, and no WebGL',async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
 await page.goto(url);
 const slider=page.getByRole('slider');await slider.waitFor();await slider.focus();
 const radius=()=>page.locator('#iris-opening').getAttribute('r');
 await slider.press('Home');assert.equal(await radius(),'70');
 const before=await page.locator('.instrument').screenshot();
 await slider.press('End');assert.equal(await radius(),'230');
 assert.equal(before.equals(await page.locator('.instrument').screenshot()),false);
 await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await slider.inputValue(),'45');assert.equal(await radius(),'142');
 await page.getByRole('button',{name:'Pause motion'}).click();
 await slider.focus();await slider.press('End');assert.equal(await radius(),'230','explicit input works while paused');
 const pose=()=>page.locator('.terrain-contours').evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(100);const paused=await pose();
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollBy(0,500);});await page.waitForTimeout(100);
 assert.equal(await pose(),paused,'paused terrain does not follow scroll');
 await page.getByRole('button',{name:'Resume motion'}).click();await page.waitForTimeout(100);
 const moved=await pose();assert.notEqual(moved,paused,'scroll changes the actual contours');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await pose(),paused);
 await slider.focus();await slider.press('Home');assert.equal(await radius(),'70','explicit input works with reduced motion');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow at '+width);
 }
 const sceneBounds=await page.locator('.field-optics').boundingBox();
 const controlsBounds=await page.locator('.field-controls').boundingBox();
 assert.ok(sceneBounds.y+sceneBounds.height<=controlsBounds.y,'scene does not overlap controls');
 assert.deepEqual(errors,[]);
 await page.close();
 const staticPage=await browser.newPage({javaScriptEnabled:false});await staticPage.goto(url);
 assert.equal(await staticPage.locator('.field-controls').isVisible(),false,'inert controls are hidden without JS');
 assert.equal(await staticPage.locator('h1').isVisible(),true);assert.equal(await staticPage.locator('.field-optics').isVisible(),true);
 const light=await staticPage.evaluate(()=>getComputedStyle(document.body).backgroundColor);
 await staticPage.emulateMedia({colorScheme:'dark'});
 assert.notEqual(await staticPage.evaluate(()=>getComputedStyle(document.body).backgroundColor),light);
});
