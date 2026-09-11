import {chromium} from 'playwright-core';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const existing={renaissance:'assets/video/scroll-demo.mp4',studio:'assets/video/studio-scroll-demo_v2.mp4',noir:'assets/video/noir-scroll-demo.mp4',luxe:'assets/video/luxe-scroll-demo.mp4',pop:'assets/video/pop-scroll-demo.mp4',atelier:'assets/video/atelier-scroll-demo.mp4','aureus-flythrough':'assets/video/aureus-preview.mp4'};
const html=await readFile('index.html','utf8');const names=[...new Set([...html.matchAll(/<article class="(?:world-card|flagship-card)[\s\S]*?href="examples\/([^/]+)\//g)].map(m=>m[1]))];
const manifest=Object.fromEntries(names.map(n=>[n,existing[n]||`assets/previews/${n}.mp4`]));await writeFile('assets/previews/manifest.json',JSON.stringify(manifest,null,2)+'\n');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const requested=process.argv.slice(2);
const unknown=requested.filter(name=>!names.includes(name));
if(unknown.length)throw new Error(`Unknown gallery example: ${unknown.join(', ')}`);
const jobs=requested.length?names.filter(name=>requested.includes(name)):names.filter(name=>!existing[name]);
await mkdir('.verify/gallery-motion/recordings',{recursive:true});
async function worker(){while(jobs.length){const name=jobs.shift();const start=Date.now();const context=await browser.newContext({viewport:{width:960,height:600},recordVideo:{dir:'.verify/gallery-motion/recordings',size:{width:960,height:600}}});const page=await context.newPage();
try{await page.goto(`http://127.0.0.1:8875/examples/${name}/`,{waitUntil:'load',timeout:20000});await page.waitForTimeout(900);const offset=(Date.now()-start)/1000;
await page.evaluate(()=>new Promise(done=>{const begin=performance.now(),max=document.documentElement.scrollHeight-innerHeight;function frame(now){const t=Math.min(1,(now-begin)/6000);scrollTo({top:max*.55*Math.sin(t*Math.PI)**2,behavior:'instant'});if(t<1)requestAnimationFrame(frame);else done();}requestAnimationFrame(frame);}));
const vid=page.video();await context.close();const path=await vid.path();await new Promise((resolve,reject)=>{const p=spawn('ffmpeg',['-y','-ss',String(offset),'-i',path,'-t','6','-vf','fps=20,scale=720:450','-c:v','libx264','-crf','25','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart','-an',manifest[name]],{stdio:'ignore'});p.on('exit',c=>c?reject(new Error('encode '+name)):resolve());});console.log('Recorded',name);
}catch(e){console.error(name,e.message);await context.close();process.exitCode=1;}}}
await Promise.all([worker(),worker(),worker()]);await browser.close();
