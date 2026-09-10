import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

test('owned GLTF assets load, time out, cancel and dispose late results',async t=>{
  const bundle=await build({stdin:{contents:"import * as Assets from './assets.tsx';import {WebGLRenderer,BufferGeometry} from 'three';window.AssetTools={...Assets,WebGLRenderer,BufferGeometry};",resolveDir:fileURLToPath(new URL('../templates/nextjs/lib/cinematic/',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser'});
  const positions=new Float32Array([0,0,0,1,0,0,0,1,0]);
  const gltf={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:positions.byteLength,uri:'data:application/octet-stream;base64,'+Buffer.from(positions.buffer).toString('base64')}],bufferViews:[{buffer:0,byteOffset:0,byteLength:positions.byteLength}],accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}]};
  const server=createServer((req,res)=>{
    if(req.url==='/tools.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return;}
    if(req.url?.endsWith('.gltf')){res.setHeader('Content-Type','application/json');if(req.url==='/slow.gltf')setTimeout(()=>res.end(JSON.stringify(gltf)),200);else res.end(JSON.stringify(gltf));return;}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Asset lifecycle</title><script type="module" src="/tools.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});t.after(()=>browser.close());
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
  assert.deepEqual(errors,[],'asset bundle initializes');
  const result=await page.evaluate(async()=>{
    const renderer=new AssetTools.WebGLRenderer(),loader=AssetTools.createAssetLoader(renderer,{dracoPath:'/draco/',basisPath:'/basis/'});
    let disposals=0;const original=AssetTools.BufferGeometry.prototype.dispose;
    AssetTools.BufferGeometry.prototype.dispose=function(){disposals++;return original.call(this)};
    const asset=await loader.load('/triangle.gltf');const vertices=asset.gltf.scene.children[0].geometry.attributes.position.count;
    asset.dispose();asset.dispose();const once=disposals;
    let timeout=false;try{await loader.load('/slow.gltf',{timeoutMs:10});}catch(error){timeout=/timed out/.test(error.message);}
    await new Promise(resolve=>setTimeout(resolve,350));const lateDisposed=disposals>once;
    const controller=new AbortController();controller.abort();let aborted=false;
    try{await loader.load('/triangle.gltf',{signal:controller.signal});}catch(error){aborted=error.name==='AbortError';}
    await loader.load('/triangle.gltf');const before=disposals;loader.dispose();loader.dispose();
    const ownerDisposed=disposals===before+1;
    let rejected=false;try{await loader.load('/triangle.gltf');}catch{rejected=true;}
    renderer.dispose();renderer.forceContextLoss();
    return{vertices,once,timeout,lateDisposed,aborted,ownerDisposed,rejected};
  });
  assert.deepEqual(result,{vertices:3,once:1,timeout:true,lateDisposed:true,aborted:true,ownerDisposed:true,rejected:true});assert.deepEqual(errors,[]);
});
