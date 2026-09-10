import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, validate } from '../compile-choreography.mjs';

const scene={metadata:{version:'2.0.0'},globals:{scrollSmoothing:.1},chapters:[{id:'opening',layers:[{id:'art',animation:{properties:[{property:'translateY',from:0,to:100,unit:'px'}]}}]}]};
test('compiler maps transforms and emits scoped live-preference lifecycle',()=>{
  const source=compile(scene);
  assert.match(source,/"y":"100px"|y: "100px"/);
  assert.match(source,/gsap.matchMedia\(root\)/);
  assert.match(source,/prefers-reduced-motion: no-preference/);
  assert.match(source,/return \(\) => mm.revert\(\)/);
  assert.doesNotMatch(source,/gsap.defaults|lagSmoothing|killAll|ScrollTrigger.getAll/);
});
test('generated cleanup removes owned ticker and listeners without destroying shared Lenis',()=>{
  const calls=[];let mediaCleanup;
  const timeline={fromTo(){return this},to(){return this}};
  const gsap={registerPlugin(){},timeline:()=>timeline,ticker:{add:fn=>calls.push(['add',fn]),remove:fn=>calls.push(['remove',fn])},
    matchMedia:()=>({add(query,fn){calls.push(['query',query]);mediaCleanup=fn()},revert(){mediaCleanup?.()}})};
  class Lenis{on(event,fn){calls.push(['on',fn])}off(event,fn){calls.push(['off',fn])}raf(){}destroy(){calls.push(['destroy'])}}
  const body=compile(scene).replace(/^import .*;\n/gm,'').replace('export function initChoreography','function initChoreography');
  const init=new Function('gsap','ScrollTrigger','Lenis',body+'\nreturn initChoreography;')(gsap,{refresh(){},update(){}},Lenis);
  const cleanup=init({});cleanup();
  assert.equal(calls.filter(([name])=>name==='destroy').length,1);
  assert.equal(calls.find(([name])=>name==='add')[1],calls.find(([name])=>name==='remove')[1]);
  assert.equal(calls.find(([name])=>name==='on')[1],calls.find(([name])=>name==='off')[1]);
  calls.length=0;const shared=new Lenis();init({},{lenis:shared})();
  assert.equal(calls.some(([name])=>name==='destroy'||name==='add'),false);
});
test('invalid roots and selector-injecting chapter IDs fail early',()=>{
  assert.throws(()=>validate(null),/Invalid choreography/);
  assert.throws(()=>compile({...scene,chapters:[{id:"bad']",layers:[{}]}]}),/invalid id/);
});
test('v3 signal inputs compile and unsupported continuous layout/paint properties fail',()=>{
  const v3={...scene,metadata:{version:'3.0.0'},signalBindings:[{selector:'.visual',input:'proximity',output:'--cinematic-rise',from:0,to:12,unit:'px',staticValue:0}]};
  const code=compile(v3);assert.match(code,/mountSignalBindings/);assert.match(code,/unbind\(\).*runtime.dispose/);
  for(const property of ['letterSpacing','backgroundColor'])assert.throws(()=>compile({...v3,chapters:[{id:'opening',layers:[{id:'art',animation:{properties:[{property,from:0,to:1}]}}]}]}),/v3 prohibits/);
  assert.throws(()=>compile({...v3,signalBindings:[{...v3.signalBindings[0],range:[1,0]}]}),/range must ascend/);
});
test('v2 spacing and background morphs compile to compositor-safe alternatives',()=>{
  const source=compile({...scene,chapters:[{...scene.chapters[0],titleReveal:{type:'letterSpacingScrub'},atmosphere:{colorMorph:{from:'#112233',to:'#334455'}}}]});
  assert.match(source,/DEPRECATED v2/);assert.match(source,/scaleX: 1.12/);assert.match(source,/paintLayer/);
  assert.doesNotMatch(source,/letterSpacing:|tl.to\([^\n]*backgroundColor:/);
});
