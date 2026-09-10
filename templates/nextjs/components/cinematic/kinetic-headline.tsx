'use client';
import {useEffect,useId,useRef} from 'react';
import {CinematicScope,useCinematicRuntime} from '@/lib/cinematic/react';
import {mountText} from '@/lib/cinematic/effects.mjs';

/** v2 props retained; authored lines and accents use the shared text lifecycle. */
export interface KineticHeadlineProps {
  text:string;lines:string[][];accentFrom?:number;eyebrow?:string;as?:'h1'|'h2'|'h3';className?:string;
}
function Headline({text,lines,accentFrom=Infinity,eyebrow,as:Tag='h2',className}:KineticHeadlineProps){
  const ref=useRef<HTMLHeadingElement>(null),runtime=useCinematicRuntime(),id=useId();
  useEffect(()=>{if(runtime&&ref.current)return mountText(ref.current,runtime,{variant:'line-mask',duration:.72});},[runtime,text,lines]);
  let index=-1;
  return <section className={className} aria-labelledby={id}>
    {eyebrow&&<p className="kh-eyebrow">{eyebrow}</p>}
    <Tag ref={ref} id={id} className="kh-title" aria-label={text}>
      {lines.map((line,i)=><span key={i} className="kh-line" style={{display:'block'}}>{line.map((word,j)=>{
        const accent=++index>=accentFrom;
        return <span key={j} className={'kh-word'+(accent?' kh-accent':'')} style={accent?{color:'var(--accent)'}:undefined}>{word}{j<line.length-1?' ':''}</span>;
      })}</span>)}
    </Tag>
  </section>;
}
export function KineticHeadline(props:KineticHeadlineProps){return <CinematicScope><Headline {...props}/></CinematicScope>;}
