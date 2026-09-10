'use client';
import dynamic from 'next/dynamic';
import {useState} from 'react';
import {CinematicProvider,TextChoreography,useCinematicRuntime} from '@/lib/cinematic/react';
import OpticalPoster from './OpticalPoster';
const Scene=dynamic(()=>import('./OpticalScene'),{ssr:false,loading:()=><div className="optical-scene"><OpticalPoster/></div>});
const beats=[['Observe','Begin with curiosity.','A small opening changes what you notice. Move toward the instrument and let the light meet you halfway.'],['Focus','Give attention a direction.','Scroll to travel around the lens. Open the aperture to separate its elements and expose the mechanism.'],['Reframe','A different perspective.','Keep the same subject. Change the way you see it. Reverse your scroll to retrace the journey.']];
function Story(){
  const runtime=useCinematicRuntime(),[aperture,setAperture]=useState(.45),[paused,setPaused]=useState(false);
  return <div className={'v3-lab field-react'+(paused?' field-paused':'')}><header><a href="#">FIELD <em>instruments</em></a><a href="/effects-lab">The effects lab ↗</a></header>
    <main><section className="field-react-intro"><p className="v3-eyebrow">An open study / No. 001</p><TextChoreography as="h1">There is more to looking.</TextChoreography><p>Light becomes a landscape. Attention becomes an instrument.</p><a className="v3-button" href="#instrument">Look a little closer ↓</a></section>
      <section id="instrument" className="field-react-journey"><div className="field-react-instrument"><Scene aperture={aperture}/><div className="v3-controls"><label>Aperture<input type="range" min="0" max="100" value={Math.round(aperture*100)} onChange={e=>{setAperture(Number(e.target.value)/100);runtime?.wake();}}/><output>{Math.round(aperture*100)}%</output></label><button type="button" aria-pressed={paused} onClick={()=>{setPaused(!paused);runtime?.setQuality(paused?'auto':'static');}}>{paused?'Resume motion':'Pause motion'}</button></div></div>
        <div>{beats.map(([name,title,copy],i)=><article className="field-react-beat" key={name}><p className="v3-eyebrow">0{i+1} / {name}</p><TextChoreography variant={i===1?'line-mask':'word-cascade'}>{title}</TextChoreography><p>{copy}</p></article>)}</div>
      </section><section className="v3-closing"><p className="v3-eyebrow">Your perspective is the missing ingredient.</p><h2>What will you<br/><em>bring into focus?</em></h2><a className="v3-button" href="https://github.com/MustBeSimo/cinematic-scroll-skill">Make something of your own ↗</a></section>
    </main><footer>A fictional optical instrument. Real Three.js geometry. Free under MIT.</footer></div>;
}
export default function FieldStory(){return <CinematicProvider><Story/></CinematicProvider>;}
