'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCinematicRuntime } from './react';
import { QUALITY } from './core.mjs';

/** Experimental TSL preview: separate imports/materials, no XR, automatic WebGL2 fallback. */
export function WebGPUPreview({ poster, className, forceWebGL = false }: { poster: ReactNode; className?: string; forceWebGL?: boolean }) {
  const root = useRef<HTMLDivElement>(null), runtime = useCinematicRuntime();
  const [backend,setBackend] = useState('poster');
  useEffect(() => {
    if (!runtime || !root.current) return;
    const element = root.current;
    let disposed = false, generation = 0, stopCurrent = () => {};
    async function start(force: boolean) {
      const current = ++generation; stopCurrent(); setBackend('poster');
      const [THREE,TSL] = await Promise.all([import('three/webgpu'),import('three/tsl')]);
      if (disposed || current !== generation) return;
      const renderer = new THREE.WebGPURenderer({antialias:false,alpha:true,forceWebGL:force});
      const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1,1,1,-1,.1,10);
      camera.position.z=1;
      const phase=TSL.uniform(0), pressure=TSL.uniform(0), material=new THREE.MeshBasicNodeMaterial();
      const field=TSL.sin(TSL.uv().x.mul(9).add(TSL.uv().y.mul(5)).add(phase).add(pressure)).mul(.5).add(.5);
      material.colorNode=TSL.mix(TSL.color('#101d48'),TSL.color('#928bff'),field);
      const geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));
      const canvas=renderer.domElement;
      canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:none';
      element.append(canvas);
      let initialized=false, visible=true, width=1, height=1, lastDpr=0, release:(()=>void)|undefined, unsubscribe=()=>{};
      const resize=new ResizeObserver(([entry])=>{width=Math.max(1,entry.contentRect.width);height=Math.max(1,entry.contentRect.height);lastDpr=0;runtime?.wake();});
      const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;runtime?.wake();});
      resize.observe(element);visibility.observe(element);
      let stopped=false;
      stopCurrent=()=>{
        if(stopped)return;stopped=true;clearTimeout(timeout);unsubscribe();release?.();resize.disconnect();visibility.disconnect();
        material.dispose();geometry.dispose();renderer.dispose();canvas.remove();
      };
      const timeout=setTimeout(()=>{if(!initialized){stopCurrent();setBackend('poster');}},15000);
      const fallback=()=>{if(disposed||current!==generation)return;if(!force)void start(true).catch(()=>setBackend('poster'));else{stopCurrent();setBackend('poster');}};
      renderer.onDeviceLost=fallback;
      try {
        await renderer.init();
        if(disposed||current!==generation||stopped){renderer.dispose();return;}
        initialized=true;clearTimeout(timeout);
        const label=(renderer.backend as unknown as {isWebGPUBackend?:boolean}).isWebGPUBackend?'webgpu':'webgl2';
        unsubscribe=runtime!.subscribe(s=>{
          const active=visible&&s.visible&&!s.reducedMotion&&s.quality!=='static';
          canvas.style.display=active?'block':'none';
          if(!active){release?.();release=undefined;return;}
          if(!release)release=runtime!.continuous(canvas);
          const dpr=Math.min(devicePixelRatio||1,QUALITY[s.quality].dpr);
          if(dpr!==lastDpr){renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);lastDpr=dpr;}
          phase.value=s.time*.25+s.scroll.progress*3;pressure.value=s.pointer.active?s.pointer.normalizedX*.7:0;
          try{renderer.render(scene,camera);}catch{fallback();}
        });
        setBackend(label);runtime!.wake();
      } catch { fallback(); }
    }
    void start(forceWebGL).catch(()=>{if(!disposed)setBackend('poster');});
    return()=>{disposed=true;generation++;stopCurrent();};
  },[runtime,forceWebGL]);
  return <div ref={root} className={className} data-cinematic-backend={backend} style={{position:'relative',minHeight:300}}>
    <div style={{position:'absolute',inset:0}}>{poster}</div>
    <span style={{position:'absolute',bottom:16,left:16,zIndex:1,color:'white',fontSize:12}}>Experimental TSL · {backend}</span>
  </div>;
}
