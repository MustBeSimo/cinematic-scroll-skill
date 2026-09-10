import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

test('runtime effects restore content, render shaders, recover context, and stop after disposal', async t => {
  const server = createServer(async (req, res) => {
    if (req.url.startsWith('/runtime/') && /^\/runtime\/[a-z.-]+\.mjs$/.test(req.url)) {
      res.setHeader('Content-Type','text/javascript');
      try { res.end(await readFile(fileURLToPath(new URL('./'+req.url.split('/').pop(), import.meta.url)))); }
      catch { res.statusCode = 404; res.end(); }
      return;
    }
    res.setHeader('Content-Type','text/html');
    res.end(`<!doctype html><meta name="viewport" content="width=device-width"><title>Runtime test</title>
      <style>body{margin:0;background:#030b20;color:white}main{min-height:220vh}h1{width:400px;font:48px Georgia}#media{width:400px;height:300px}button{margin:40px;padding:20px}</style>
      <main><h1 data-cinematic-text="character-wave">Motion carries meaning.</h1>
      <button data-cinematic-proximity="magnetic"><span data-proximity-visual style="display:block">Inspect</span></button>
      <div id="media"></div><p>Always readable content</p></main>
      <script type="module">
        import {createCinematicRuntime,mountDeclarativeEffects} from '/runtime/index.mjs';
        import {createShaderLayer} from '/runtime/webgl.mjs';
        window.errors=[]; window.runtime=createCinematicRuntime(document,{onError:e=>errors.push(e.message)});
        window.cleanEffects=mountDeclarativeEffects(document,runtime);
        window.layer=createShaderLayer(document,runtime,{onError:e=>errors.push(e.message)});
        window.addPreset=(preset)=>layer.add(document.querySelector('#media'),{preset});
        window.removeSurface=addPreset('atmosphere');
        window.ticks=0;runtime.subscribe(()=>{window.ticks++});window.ready=true;
      </script>`);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--enable-unsafe-swiftshader'] });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport:{width:1000,height:800} });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>window.ready);
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('h1').innerText(),'Motion carries meaning.');
  assert.equal(await page.locator('h1').getAttribute('aria-label'),'Motion carries meaning.');
  assert.equal(await page.locator('canvas').count(),1);
  for (const preset of ['displacement','refraction','atmosphere','portal']) {
    await page.evaluate(p=>{removeSurface();removeSurface=addPreset(p);runtime.wake();},preset);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>layer.info.draws),1,preset+' draws');
    assert.deepEqual(await page.evaluate(()=>errors),[],preset+' compiles');
    const pixels = await page.evaluate(() => {
      runtime.tick(performance.now());
      const gl=layer.canvas.getContext('webgl2'), r=document.querySelector('#media').getBoundingClientRect();
      const data=new Uint8Array(4*16*16);
      gl.readPixels(Math.round((r.left+r.width/2)*layer.info.dpr),Math.round((innerHeight-r.bottom+r.height/2)*layer.info.dpr),16,16,gl.RGBA,gl.UNSIGNED_BYTE,data);
      return { opaque:data.filter((_,i)=>i%4===3).some(v=>v===255), color:data.filter((_,i)=>i%4!==3).some(v=>v>5) };
    });
    assert.deepEqual(pixels,{opaque:true,color:true},preset+' produces visible pixels');
  }
  await page.evaluate(()=>{removeSurface();removeSurface=addPreset('atmosphere');scrollTo(0,1000);});
  await page.waitForTimeout(1600);
  const offscreen=await page.evaluate(()=>ticks);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>ticks),offscreen,'offscreen atmosphere sleeps');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
  const box=await page.locator('button').boundingBox();
  await page.mouse.move(box.x+box.width-2,box.y+box.height/2);
  await page.waitForTimeout(300);
  assert.notEqual(await page.locator('[data-proximity-visual]').evaluate(el=>el.style.transform),'translate3d(0px,0px,0)');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('h1 span').count(),0);
  assert.equal(await page.locator('canvas').isVisible(),false);
  const before=await page.evaluate(()=>ticks);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>ticks),before,'reduced motion has no perpetual clock');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.extension=layer.canvas.getContext('webgl2').getExtension('WEBGL_lose_context');extension.loseContext();});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('canvas').isVisible(),false);
  await page.evaluate(()=>extension.restoreContext());
  await page.waitForTimeout(250);
  assert.equal(await page.locator('canvas').isVisible(),true);
  assert.equal(await page.evaluate(()=>layer.info.draws),1);
  await page.evaluate(()=>{removeSurface();layer.dispose();cleanEffects();runtime.dispose();});
  assert.equal(await page.locator('canvas').count(),0);
  assert.equal(await page.locator('h1 span').count(),0);
  assert.equal(await page.locator('h1').getAttribute('aria-label'),null);
  const stopped=await page.evaluate(()=>ticks);await page.mouse.move(500,500);await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>ticks),stopped);
  assert.deepEqual(errors,[]);
});
