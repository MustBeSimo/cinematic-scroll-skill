import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.SCENE_PREVIEW_URL||'http://127.0.0.1:8875';
const scenes=['flagship','immersive','volumetric-aether','crystalline-monolith','gallery-flythrough','jungle-flythrough'];
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const out='.verify/3d-refinement/tests';await mkdir(out,{recursive:true});
test.after(()=>browser.close());
for(const name of scenes)test(name+' renders, responds to input, and holds motion when requested',{timeout:120000},async t=>{
 const page=await browser.newPage({viewport:{width:1280,height:800}});t.after(()=>page.close());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const surfaceRequests=[];page.on('response',response=>{if(response.url().includes('/_surface-assets/')&&response.url().endsWith('.jpg'))surfaceRequests.push({url:response.url(),status:response.status()});});
 await page.goto(`${base}/examples/${name}/`,{waitUntil:'networkidle'});
 if(['gallery-flythrough','jungle-flythrough'].includes(name)){
  assert.equal(new Set(surfaceRequests.map(r=>r.url)).size,6,'two shared PBR sets load once per scene');
  assert.ok(surfaceRequests.every(r=>r.status===200),'all diffuse, normal and packed surface maps load');
 }
 const canvas=page.locator('canvas[data-scene-state]');await canvas.waitFor({timeout:30000});
 await page.locator('.cs-scene-controls summary').click();
 await page.getByRole('button',{name:'Pause drift',exact:true}).click();
 await page.waitForTimeout(250);
 assert.equal(await canvas.getAttribute('data-scene-state'),'paused');
 const count=Number(await canvas.getAttribute('data-scene-frames'));await page.waitForTimeout(350);
 assert.equal(Number(await canvas.getAttribute('data-scene-frames')),count,'paused loop stops scheduling');
 const input=page.locator('.cs-scene-controls input');const initial=await input.inputValue();
 async function sceneShot(){const style=await page.addStyleTag({content:'body * {visibility:hidden!important} canvas[data-scene-state],#gl-stage {visibility:visible!important}'});const shot=await page.screenshot();await style.evaluate(el=>el.remove());return shot;}
 const before=await sceneShot();await input.focus();await input.press('End');await page.waitForTimeout(250);const after=await sceneShot();
 assert.notEqual(await input.inputValue(),initial,'keyboard controls the parameter');
 assert.ok(!before.equals(after),'parameter changes the rendered scene while paused');
 await page.getByRole('button',{name:'Reset study',exact:true}).click();assert.equal(await input.inputValue(),initial);
 await page.getByRole('button',{name:'Resume drift',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(350);
 assert.equal(await canvas.getAttribute('data-scene-state'),'reduced');
 const reducedCount=Number(await canvas.getAttribute('data-scene-frames'));await page.waitForTimeout(350);
 assert.equal(Number(await canvas.getAttribute('data-scene-frames')),reducedCount,'live reduced motion stops the loop');
 await page.evaluate(()=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.4));await page.waitForTimeout(250);
 const held=Number(await canvas.getAttribute('data-scene-frames'));await page.waitForTimeout(350);assert.equal(Number(await canvas.getAttribute('data-scene-frames')),held);
 // Exercise real GPU context loss and restoration without rebuilding duplicate scenes.
 await canvas.evaluate(el=>{const gl=el.getContext('webgl2')||el.getContext('webgl');const ext=gl.getExtension('WEBGL_lose_context');window.__restoreStudy=()=>ext.restoreContext();ext.loseContext();});
 await page.waitForTimeout(250);assert.equal(await canvas.getAttribute('data-scene-state'),'lost');
 await page.evaluate(()=>window.__restoreStudy());await page.waitForTimeout(1200);
 assert.equal(await canvas.getAttribute('data-scene-state'),'reduced');
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.waitForTimeout(250);
  const overflow=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *,header *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&getComputedStyle(el).position!=='fixed'}).slice(0,6).map(el=>el.className)}));
  assert.ok(overflow.scrollWidth<=width+1,JSON.stringify(overflow));
 }
 await page.setViewportSize({width:390,height:844});await page.locator('.cs-scene-controls').evaluate(el=>el.open=false);
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);await page.screenshot({path:`${out}/${name}-mobile.png`});
 assert.deepEqual(errors,[]);
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});t.after(()=>reduced.close());
 const reduceErrors=[];reduced.on('pageerror',e=>reduceErrors.push(e.message));await reduced.goto(`${base}/examples/${name}/`,{waitUntil:'networkidle'});await reduced.locator('canvas[data-scene-state="reduced"]').waitFor({timeout:30000});assert.deepEqual(reduceErrors,[],'initial reduced-motion boot');
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});t.after(()=>nojs.close());await nojs.goto(`${base}/examples/${name}/`);
 assert.ok(await nojs.locator('h1,h2').count(),'a readable no-JS story');
 await nojs.screenshot({path:`${out}/${name}-nojs.png`});
 await writeFile(`${out}/${name}.json`,JSON.stringify({errors,reduceErrors,passed:true},null,2));
});
for(const name of ['gallery-flythrough','jungle-flythrough'])test(name+' retains a working scene when every surface map fails',async t=>{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});t.after(()=>page.close());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/_surface-assets/*.jpg',route=>route.abort());
 await page.goto(`${base}/examples/${name}/`,{waitUntil:'networkidle'});
 await page.locator('canvas[data-scene-state="reduced"]').waitFor();
 assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('no-webgl')),false);
 assert.ok(await page.locator('h1').isVisible());assert.deepEqual(errors,[]);
});
