'use client';
import {useId,type ReactNode} from 'react';
import {CinematicScope,MagneticSurface} from '@/lib/cinematic/react';

export type TiltCardProps={eyebrow?:string;title:string;children?:ReactNode;maxDeg?:number};
/** v2 props retained; stable outer geometry, one inner transform owner. */
export function TiltCard({eyebrow,title,children,maxDeg=8}:TiltCardProps){
  const id=useId();
  return <CinematicScope><article tabIndex={0} aria-labelledby={id} style={{maxWidth:'24rem'}}>
    <MagneticSurface variant="depth" strength={Math.max(0,Math.min(15,maxDeg))/.35}>
      <div style={{position:'relative',display:'grid',gap:'var(--space-md)',padding:'var(--space-xl)',border:'1px solid var(--line)',borderRadius:'var(--radius-lg)',background:'var(--surface)'}}>
        <span aria-hidden style={{position:'absolute',inset:0,borderRadius:'inherit',pointerEvents:'none',opacity:'var(--cinematic-proximity,0)',background:'radial-gradient(ellipse at 30% 20%,#ffffff35,transparent 65%)'}}/>
        {eyebrow&&<p style={{fontFamily:'var(--font-ui)',fontSize:'var(--size-caption)',letterSpacing:'.22em',textTransform:'uppercase',color:'var(--fg-dim)'}}>{eyebrow}</p>}
        <h2 id={id} style={{fontFamily:'var(--font-display)',fontSize:'var(--size-h4)',lineHeight:'var(--lh-tight)',fontWeight:600}}>{title}</h2>
        {children&&<div style={{color:'var(--fg-dim)'}}>{children}</div>}
      </div>
    </MagneticSurface>
  </article></CinematicScope>;
}
