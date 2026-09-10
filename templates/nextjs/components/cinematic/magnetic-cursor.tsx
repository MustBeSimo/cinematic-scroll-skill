'use client';
import {useEffect,useRef} from 'react';
import {CinematicScope,useCinematicRuntime} from '@/lib/cinematic/react';
import {clamp,damp} from '@/lib/cinematic/core.mjs';

export interface MagneticCursorProps {targets?:string;lerp?:number;pull?:number;snapScale?:number}
function Cursor({targets='[data-magnetic]',lerp=.18,pull=.35,snapScale=2.4}:MagneticCursorProps){
  const ref=useRef<HTMLDivElement>(null),runtime=useCinematicRuntime();
  useEffect(()=>{
    if(!runtime||!ref.current)return;
    const dot=ref.current,elements=[...document.querySelectorAll(targets)];
    let tx=0,ty=0,x=0,y=0,scale=1,snapped=false,started=false;
    const unread=runtime.read(s=>{
      tx=s.pointer.x;ty=s.pointer.y;snapped=false;
      if(!s.pointer.active)return;
      for(const el of elements){const r=el.getBoundingClientRect();if(tx>=r.left&&tx<=r.right&&ty>=r.top&&ty<=r.bottom){tx+=(r.left+r.width/2-tx)*clamp(pull);ty+=(r.top+r.height/2-ty)*clamp(pull);snapped=true;break;}}
    });
    const unsubscribe=runtime.subscribe(s=>{
      const active=s.pointer.active&&s.visible&&!s.reducedMotion&&s.quality!=='static';
      dot.style.display=active?'block':'none';if(!active){started=false;return false;}
      if(!started){x=tx;y=ty;started=true;}
      const rate=-60*Math.log(1-clamp(lerp,.001,.999));
      x=damp(x,tx,rate,s.delta);y=damp(y,ty,rate,s.delta);scale=damp(scale,snapped?Math.max(1,snapScale):1,15,s.delta);
      dot.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
      dot.dataset.snapped=String(snapped);
      return Math.abs(x-tx)+Math.abs(y-ty)+Math.abs(scale-(snapped?Math.max(1,snapScale):1))>.01;
    });
    return()=>{unread();unsubscribe();dot.style.display='none';};
  },[runtime,targets,lerp,pull,snapScale]);
  return <div ref={ref} aria-hidden style={{position:'fixed',top:0,left:0,width:12,height:12,borderRadius:'50%',background:'var(--accent)',pointerEvents:'none',zIndex:9999,display:'none'}}/>;
}
/** Native cursor remains available; decorative trail sleeps once settled. */
export function MagneticCursor(props:MagneticCursorProps){return <CinematicScope><Cursor {...props}/></CinematicScope>;}
export default MagneticCursor;
