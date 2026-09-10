import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base=process.env.V3_URL||'http://127.0.0.1:8766';
const executablePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
test('React scenes respond, pause, recover GPU context and preserve fallback',async t=>{
  const browser=await chromium.launch({executablePath,headless:true,args:['--enable-unsafe-swiftshader']});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1280,height:900}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/effects-lab');
  await page.waitForFunction(()=>document.querySelector('canvas')?.width>1);
  await page.waitForTimeout(1200);
  await page.getByRole('combobox').selectOption('displacement');await page.waitForTimeout(250);
  const before=await page.locator('canvas').screenshot();
  await page.getByRole('combobox').selectOption('portal');await page.waitForTimeout(250);
  const after=await page.locator('canvas').screenshot();
  assert.equal(before.equals(after),false,'selector changes the rendered scene');
  const link=page.getByRole('link',{name:'Step into the field'}), box=await link.boundingBox();
  await page.mouse.move(box.x+box.width-1,box.y+box.height/2);await page.waitForTimeout(350);
  const moved=await link.boundingBox();
  assert.ok(Math.abs(box.x-moved.x)<.1&&Math.abs(box.y-moved.y)<.1,'magnetic control hit box stays fixed');
  await page.getByRole('button',{name:'Pause motion'}).click();await page.waitForTimeout(150);
  assert.equal(await page.locator('h1').innerText(),'Motion you can make your own.');
  assert.equal(await page.locator('h1').evaluate(el=>el.children.length),0,'pause reverts SplitText');
  assert.equal(await page.locator('[data-cinematic-render]').evaluate(el=>getComputedStyle(el).opacity),'0');
  await page.getByRole('button',{name:'Resume motion'}).click();await page.waitForTimeout(250);
  await page.evaluate(()=>{window.loss=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');loss.loseContext();});
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-cinematic-render]').evaluate(el=>getComputedStyle(el).opacity),'0','lost context shows poster');
  await page.evaluate(()=>loss.restoreContext());await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-cinematic-render]').evaluate(el=>getComputedStyle(el).opacity),'1','restored context is shown');
  await page.goto(base+'/webgpu-preview');
  await page.getByRole('checkbox').check();
  await page.waitForSelector('[data-cinematic-backend="webgl2"]',{timeout:30000});
  assert.equal(await page.locator('canvas').count(),1,'separate preview owns exactly one canvas');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
  assert.equal(await page.locator('canvas').isVisible(),false,'TSL static mode uses poster');
  assert.deepEqual(errors,[]);
});

test('React route without WebGL retains readable content and a poster',async t=>{
  const browser=await chromium.launch({executablePath,headless:true,args:['--disable-webgl']});t.after(()=>browser.close());
  const page=await browser.newPage();await page.goto(base+'/effects-lab');await page.waitForTimeout(1000);
  assert.equal(await page.locator('canvas').count(),0);
  assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' '),'Motion you can make your own.');
  assert.equal(await page.locator('.v3-poster').isVisible(),true);
});
