import {clamp} from './core.mjs';
export const SIGNAL_INPUTS=['scroll-progress','scroll-velocity','pointer-x','pointer-y','proximity'];

/** Declarative signal → custom-property bindings. Consume outputs in transform/opacity only. */
export function mountSignalBindings(root,runtime,bindings=[]) {
  const cleanups=[];
  try {
    for(const binding of bindings){
      if(!SIGNAL_INPUTS.includes(binding.input)||!/^--cinematic-[a-z0-9-]+$/.test(binding.output))throw new TypeError('Invalid cinematic signal binding');
      if(['from','to','staticValue','radius'].some(key=>binding[key]!==undefined&&!Number.isFinite(binding[key])))throw new TypeError('Signal values must be finite');
      if(binding.range&&(!Array.isArray(binding.range)||binding.range.length!==2||!binding.range.every(Number.isFinite)||binding.range[0]>=binding.range[1]))throw new TypeError('Signal range must ascend');
      if(binding.unit&&!['px','deg','%'].includes(binding.unit))throw new TypeError('Unsupported signal unit');
      const elements=[...root.querySelectorAll(binding.selector)];
      if(root.matches?.(binding.selector))elements.unshift(root);
      for(const element of elements){
        const original=element.style.getPropertyValue(binding.output),priority=element.style.getPropertyPriority(binding.output);
        const target=binding.input==='proximity'?runtime.track(element,{radius:binding.radius??120}):null;
        const unsubscribe=runtime.subscribe(s=>{
          let value={
            'scroll-progress':s.scroll.progress,'scroll-velocity':clamp(Math.abs(s.scroll.velocity)/2000),
            'pointer-x':s.pointer.active?(s.pointer.normalizedX+1)/2:.5,
            'pointer-y':s.pointer.active?(s.pointer.normalizedY+1)/2:.5,'proximity':target?.current.amount??0,
          }[binding.input];
          const [start,end]=binding.range||[0,1];value=clamp((value-start)/Math.max(.0001,end-start));
          const from=binding.from??0,to=binding.to??1;
          const result=s.reducedMotion||s.quality==='static'?(binding.staticValue??from):from+(to-from)*value;
          element.style.setProperty(binding.output,String(result)+(binding.unit||''));
        });
        cleanups.push(()=>{unsubscribe();target?.dispose();if(original)element.style.setProperty(binding.output,original,priority);else element.style.removeProperty(binding.output);});
      }
    }
  } catch(error){cleanups.reverse().forEach(fn=>fn());throw error;}
  return()=>cleanups.reverse().forEach(fn=>fn());
}
