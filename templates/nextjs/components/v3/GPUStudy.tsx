'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { CinematicProvider } from '@/lib/cinematic/react';
const Preview=dynamic(()=>import('@/lib/cinematic/webgpu').then(m=>m.WebGPUPreview),{ssr:false});
export default function GPUStudy(){
  const [force,setForce]=useState(false);
  return <CinematicProvider><main className="v3-lab">
    <header><a href="/effects-lab">← Effects lab</a><span>Experimental renderer</span></header>
    <section className="v3-closing"><p className="v3-eyebrow">Separate by design</p><h1>A new way to<br/><em>paint with light.</em></h1>
      <p>TSL materials, with WebGPU when available and automatic WebGL2 fallback. No XR or legacy shader mixing.</p>
    </section>
    <Preview forceWebGL={force} className="v3-scene" poster={<div className="v3-poster" style={{height:'100%'}}/>}/>
    <section className="v3-controls"><label><input type="checkbox" checked={force} onChange={e=>setForce(e.target.checked)}/> Force WebGL2 fallback for comparison</label><p>Reduced motion keeps the poster. Move and scroll to shift the field.</p></section>
  </main></CinematicProvider>;
}
