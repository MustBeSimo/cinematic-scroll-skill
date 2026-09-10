import {createCinematicRuntime,clamp} from '../../runtime/index.mjs';
const runtime=createCinematicRuntime(document);
const section=document.querySelector('.observatory');
const focus=document.querySelector('#focus'),output=document.querySelector('#focus-value');
const pause=document.querySelector('#field-pause'),reset=document.querySelector('#field-reset');
const opening=document.querySelector('#iris-opening'),edge=document.querySelector('#iris-edge');
const terrain=document.querySelector('.terrain-contours'),blades=document.querySelector('.iris-blades');
let progress=0,aperture=.45,paused=false;
const unread=runtime.read(()=>{
  const rect=section.getBoundingClientRect();
  progress=clamp((innerHeight*.35-rect.top)/Math.max(1,rect.height-innerHeight*.65));
});
// The SVG is the instrument, so explicit input works without a graphics context.
function adjust(){
  aperture=Number(focus.value)/100;
  const radius=70+aperture*160;
  opening.setAttribute('r',String(radius));edge.setAttribute('r',String(radius));
  blades.style.transform=`rotate(${aperture*28}deg)`;
  output.value=focus.value+'%';
  focus.setAttribute('aria-valuetext',focus.value+' percent open');
  runtime.wake();
}
const unsubscribe=runtime.subscribe(s=>{
  const angle=s.reducedMotion||s.quality==='static'?0:progress*42;
  terrain.style.transform=`rotate(${angle}deg)`;
});
function pauseMotion(){
  paused=!paused;pause.setAttribute('aria-pressed',String(paused));
  pause.textContent=paused?'Resume motion':'Pause motion';
  runtime.setQuality(paused?'static':'auto');
}
function resetAperture(){focus.value='45';adjust();}
focus.addEventListener('input',adjust);pause.addEventListener('click',pauseMotion);reset.addEventListener('click',resetAperture);
adjust();document.querySelector('.field-controls').hidden=false;
addEventListener('pagehide',event=>{
  if(event.persisted)return;
  focus.removeEventListener('input',adjust);pause.removeEventListener('click',pauseMotion);reset.removeEventListener('click',resetAperture);
  unsubscribe();unread();runtime.dispose();
});
