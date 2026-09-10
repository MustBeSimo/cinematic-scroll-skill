'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { CinematicProvider, TextChoreography, MagneticSurface, useCinematicRuntime } from '@/lib/cinematic/react';
import type { TextVariant } from '@/lib/cinematic/effects.mjs';
const ShaderStudy = dynamic(() => import('./ShaderStudy'), { ssr: false, loading: () => <div className="v3-scene v3-poster"/> });
const samples: [TextVariant,string][] = [
  ['line-mask','An idea, unfolding.'],['word-cascade','Every word finds its place.'],['character-wave','A gentle ripple.'],
  ['velocity-skew','Keep the momentum.'],['scramble','Clarity from chaos.'],['variable-axis','A change of emphasis.'],
];
function Lab() {
  const runtime = useCinematicRuntime(), [preset,setPreset] = useState<'displacement'|'refraction'|'atmosphere'|'portal'>('atmosphere');
  const [paused,setPaused] = useState(false);
  return <div className="v3-lab">
    <header><a href="/">Cinematic <em>Scroll</em></a><span>v3 / React laboratory</span><a href="#v3-type">Explore ↓</a></header>
    <main>
      <section className="v3-opening"><div><p className="v3-eyebrow">A little movement. A lot of feeling.</p>
        <TextChoreography as="h1">Motion you can make your own.</TextChoreography>
        <p>Explore the same effects as reusable React components. Words, light and surfaces respond to the way you move.</p>
        <MagneticSurface><a className="v3-button" href="#v3-shaders">Step into the field ↗</a></MagneticSurface>
      </div><ShaderStudy preset={preset}/></section>
      <section id="v3-shaders" className="v3-controls" aria-label="Shader study controls">
        <label>Study <select value={preset} onChange={e=>setPreset(e.target.value as typeof preset)}>
          {['displacement','refraction','atmosphere','portal'].map(value=><option key={value}>{value}</option>)}
        </select></label>
        <button type="button" aria-pressed={paused} onClick={()=>{setPaused(!paused);runtime?.setQuality(paused?'auto':'static');}}>{paused?'Resume motion':'Pause motion'}</button>
        <span>Move the pointer across the field. Scroll to shift it.</span>
      </section>
      <section id="v3-type"><div className="v3-heading"><p className="v3-eyebrow">01 / Text choreography</p><h2>A language of <em>movement.</em></h2></div>
        <div className="v3-grid">{samples.map(([variant,text],i)=><article key={variant}><p className="v3-eyebrow">0{i+1} / {variant.replaceAll('-',' ')}</p><TextChoreography as="h3" variant={variant}>{text}</TextChoreography></article>)}</div>
      </section>
      <section className="v3-closing"><p className="v3-eyebrow">Free to use. Free to explore.</p><h2>Make your next idea<br/><em>feel alive.</em></h2><a className="v3-button" href="https://github.com/MustBeSimo/cinematic-scroll-skill">Get the source ↗</a></section>
    </main><footer>Motion craft for everyone. MIT licensed.</footer>
  </div>;
}
export default function EffectsLab(){return <CinematicProvider><Lab/></CinematicProvider>;}
