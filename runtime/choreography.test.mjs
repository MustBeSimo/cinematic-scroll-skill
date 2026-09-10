import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSignalBindings} from './choreography.mjs';
test('signal bindings map/clamp inputs, restore static values and clean up only owned styles',()=>{
  const styles=new Map([['--cinematic-shift','3px'],['color','blue']]),listeners=new Set();let disposed=false;
  const element={style:{getPropertyValue:key=>styles.get(key)||'',getPropertyPriority:()=>'',setProperty:(key,value)=>styles.set(key,value),removeProperty:key=>styles.delete(key)}};
  const runtime={subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},track:()=>({current:{amount:.75},dispose:()=>{disposed=true}})};
  const unmount=mountSignalBindings({querySelectorAll:()=>[element]},runtime,[{selector:'.visual',input:'proximity',output:'--cinematic-shift',from:0,to:20,unit:'px',staticValue:0}]);
  const signals={scroll:{progress:.5,velocity:500},pointer:{active:true,normalizedX:0,normalizedY:0},reducedMotion:false,quality:'balanced'};
  listeners.forEach(fn=>fn(signals));assert.equal(styles.get('--cinematic-shift'),'15px');
  listeners.forEach(fn=>fn({...signals,quality:'static'}));assert.equal(styles.get('--cinematic-shift'),'0px');
  unmount();assert.equal(styles.get('--cinematic-shift'),'3px');assert.equal(styles.get('color'),'blue');assert.equal(listeners.size,0);assert.equal(disposed,true);
});
test('invalid signal ranges and nonfinite values cannot become CSS',()=>{
  const root={querySelectorAll:()=>[]};
  for(const extra of [{range:[1,0]},{to:Infinity},{unit:'url(bad)'}])assert.throws(()=>mountSignalBindings(root,{},[{input:'pointer-x',output:'--cinematic-x',selector:'x',...extra}]));
});
