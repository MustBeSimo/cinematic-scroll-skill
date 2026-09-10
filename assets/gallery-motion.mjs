import {createCinematicRuntime,mountProximity,clamp} from '../runtime/index.mjs';
const runtime=createCinematicRuntime(document);
const entries=[...document.querySelectorAll('[data-gallery-preview]')].map(el=>{
 const video=el.querySelector('video');video.muted=true;video.loop=true;video.playsInline=true;
 const target=runtime.track(el,{radius:110});mountProximity(el,runtime,{variant:'depth',strength:9,radius:110});
 const entry={el,video,target,rect:null,wanted:false,failed:false,token:0};
 video.addEventListener('playing',()=>{if(entry.wanted)video.classList.add('is-playing');else video.pause();});
 video.addEventListener('error',()=>{entry.failed=true;video.classList.remove('is-playing');});
 el.addEventListener('focusin',()=>runtime.wake());el.addEventListener('focusout',()=>runtime.wake());
 return entry;
});
let paused=false;
const motionToggles=[...document.querySelectorAll('[data-gallery-pause]')];
for(const button of motionToggles){button.hidden=false;button.addEventListener('click',()=>{paused=!paused;for(const control of motionToggles){control.textContent=paused?'Resume motion':'Pause motion';control.setAttribute('aria-pressed',String(paused));}runtime.setQuality(paused?'static':'auto');runtime.wake();});}
const artVideo=document.querySelector('[data-art-video]');
const artEntry=artVideo?{el:artVideo,video:artVideo,wanted:false,failed:false,token:0}:null;
if(artEntry){artEntry.el.dataset.galleryPreview='assets/brand/renaissance-h3-15s.mp4';artVideo.addEventListener('playing',()=>{if(artEntry.wanted)artVideo.classList.add('is-playing');else artVideo.pause();});artVideo.addEventListener('error',()=>{artEntry.failed=true;artVideo.classList.remove('is-playing');});}
const stickers=[...document.querySelectorAll('[data-sticker]')].map(el=>({el,visual:el.querySelector('[data-sticker-motion]'),rect:null}));
let artRect=null,stickerTime=0;
function playback(entry,wanted){
 if(entry.wanted===wanted)return;entry.wanted=wanted;const token=++entry.token;
 if(!wanted){entry.video.pause();entry.video.classList.remove('is-playing');return;}
 if(entry.failed)return;
 if(!entry.video.getAttribute('src'))entry.video.src=entry.el.dataset.galleryPreview;
 entry.video.play().then(()=>{if(token!==entry.token&&!entry.wanted)entry.video.pause();}).catch(()=>{if(token===entry.token){entry.failed=true;entry.video.classList.remove('is-playing');}});
}
const headings=[...document.querySelectorAll('.section-head,.end,.intro')];
let headingRects=[];
runtime.read(()=>{for(const e of entries)e.rect=e.el.getBoundingClientRect();headingRects=headings.map(el=>el.getBoundingClientRect());for(const e of stickers)e.rect=e.el.getBoundingClientRect();artRect=artVideo?.getBoundingClientRect();});
runtime.subscribe(s=>{
 const allowed=s.visible&&!s.reducedMotion&&!paused;
 if(artEntry)playback(artEntry,Boolean(allowed&&artRect.bottom>0&&artRect.top<innerHeight));
 let animateStickers=false;
 if(allowed)stickerTime+=s.delta;
 stickers.forEach((entry,i)=>{const active=allowed&&entry.rect.bottom>0&&entry.rect.top<innerHeight;animateStickers||=active;entry.visual.style.transform=active?`translateY(${Math.sin(stickerTime*1.2+i)*4}px) rotate(${Math.sin(stickerTime*.75+i)*4}deg)`:'none';});
 const visible=entries.filter(e=>e.rect.bottom>70&&e.rect.top<innerHeight&&e.rect.width>0);
 let chosen=null;
 if(allowed){
  chosen=visible.find(e=>e.el.contains(document.activeElement));
  if(!chosen&&s.pointer.active)chosen=visible.filter(e=>!e.el.hasAttribute('data-autopreview')&&e.target.current.amount>.08).sort((a,b)=>a.target.current.distance-b.target.current.distance)[0];
  if(!chosen&&s.coarsePointer)chosen=visible.filter(e=>!e.el.hasAttribute('data-autopreview')&&e.rect.top<innerHeight*.7&&e.rect.bottom>innerHeight*.3).sort((a,b)=>Math.abs((a.rect.top+a.rect.bottom)/2-innerHeight/2)-Math.abs((b.rect.top+b.rect.bottom)/2-innerHeight/2))[0];
 }
 for(const e of entries){
  playback(e,Boolean(allowed&&visible.includes(e)&&(e===chosen||e.el.hasAttribute('data-autopreview'))));
  const media=e.el.querySelector('.gallery-media');
  if(media){const offset=allowed?clamp((innerHeight/2-(e.rect.top+e.rect.height/2))/innerHeight,-1,1)*22:0;media.style.transform=`translate3d(0,${offset}px,0) scale(${allowed?1.055:1})`;}
 }
 headings.forEach((el,i)=>{const r=headingRects[i],p=allowed?clamp((r.top-innerHeight*.6)/(innerHeight*.4)):0;el.style.transform=`translate3d(0,${p*28}px,0)`;el.style.opacity=String(1-p*.45);});
 const art=document.querySelector('.studio-art-plane');if(art)art.style.transform=allowed?`translate3d(${s.pointer.active&&!s.coarsePointer?(s.pointer.x/innerWidth-.5)*12:0}px,${Math.min(s.scroll.y,600)*.03}px,0)`:'none';
 const progress=document.querySelector('.site-head .progress');if(progress)progress.style.transform=`scaleX(${s.scroll.progress})`;
 return animateStickers;
});
addEventListener('pagehide',()=>{for(const e of entries)playback(e,false);if(artEntry)playback(artEntry,false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const e of entries)playback(e,false);if(artEntry)playback(artEntry,false);}else runtime.wake();});
addEventListener('pageshow',()=>runtime.refresh());

const directory=document.querySelector('.studio-directory');
if(directory){
 const summary=directory.querySelector('summary');
 directory.addEventListener('click',e=>{if(e.target.closest('a'))directory.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&directory.open){directory.open=false;summary.focus();}});
 document.addEventListener('click',e=>{if(!directory.contains(e.target))directory.open=false;});
 directory.addEventListener('focusout',e=>{if(!directory.contains(e.relatedTarget))directory.open=false;});
}

const picker=document.querySelector('.agent-picker');
if(picker){picker.hidden=false;picker.addEventListener('click',e=>{const button=e.target.closest('[data-agent]');if(!button)return;for(const option of picker.querySelectorAll('button'))option.setAttribute('aria-pressed',String(option===button));const agent=button.dataset.agent;document.querySelector('#install-command').textContent='npx skills add MustBeSimo/cinematic-scroll-skill'+(agent?' --agent '+agent:'');document.querySelector('#agent-install-note').textContent=agent?`Install for ${button.textContent} in this project.`:'The installer lets you choose from its supported coding agents.';runtime.refresh();});}
const search=document.querySelector('#project-search');
if(search){
 document.querySelector('.project-toolbar').hidden=false;
 const cards=[...document.querySelectorAll('.project-card')];
 search.addEventListener('input',()=>{
  const query=search.value.trim().toLowerCase();let total=0;
  for(const card of cards){card.hidden=!`${card.dataset.project} ${card.textContent}`.toLowerCase().includes(query);if(!card.hidden)total++;}
  for(const id of ['flagships','worlds']){const section=document.getElementById(id);const count=section.querySelectorAll('.project-card:not([hidden])').length;section.hidden=count===0;document.querySelector(`[data-count-for="${id}"]`).textContent=`${count} project${count===1?'':'s'}`;}
  document.getElementById('project-result-count').textContent=`${total} project${total===1?'':'s'}`;
  document.querySelector('.project-empty').hidden=total>0;
  runtime.refresh();
 });
 document.querySelectorAll('.project-prompt').forEach(el=>el.addEventListener('toggle',()=>runtime.refresh()));
}
