import React from 'react';
import {AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../../fonts';
import {bright} from '../../theme';

// ACT III — THE RANGE (14–38s), vertical. Four clashing aesthetics from one
// engine. Each world is a full-height vertical "page": big TYPE above a centered
// 16:9 footage card, name/caption below. The viewport SCROLLS through them with
// an eased accelerate→decelerate wipe — the transition demonstrates the product.
const H = 1920;

// rate kept low enough that each clip is STILL SCROLLING when it wipes out —
// a frozen last frame reads as a snap. (clipDur/rate ≥ on-screen frames.)
const WORLDS = [
  {src: 'footage/noir.mp4',        arrive: 0,   rate: 0.60, index: '01', title: 'VANTASCOPE',     name: 'Sci-fi noir',           accent: '#E8484F'},
  {src: 'footage/renaissance.mp4', arrive: 156, rate: 0.60, index: '02', title: 'CLASSIC TOUCH',  name: 'Renaissance editorial', accent: '#B6892F'},
  {src: 'footage/luxe.mp4',        arrive: 336, rate: 0.74, index: '03', title: 'MAISON SOLENNE', name: 'Quiet luxury',          accent: '#A4652F'},
  {src: 'footage/pop.mp4',         arrive: 516, rate: 0.54, index: '04', title: 'BLOOM',           name: 'Gen-Z pop',             accent: '#FF2E93'},
];

const CARD_W = 1000;
const CARD_H = Math.round((CARD_W * 9) / 16); // 562

export const VWorlds: React.FC = () => {
  const frame = useCurrentFrame();
  // dwell ~156f on each world, then an EASED scroll-wipe to the next — a smooth
  // accelerate→decelerate scroll, exactly like the 16:9 ReelWorlds.
  const ease = Easing.inOut(Easing.cubic);
  const step = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const y = -H * (step(156, 184) + step(336, 364) + step(516, 544));
  // clean fade to cream at the very end so the cut into the 3D act is seamless.
  const tail = interpolate(frame, [706, 720], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: 4 * H, transform: `translateY(${y}px)`}}>
        {WORLDS.map((w, i) => (
          <div key={w.src} style={{position: 'absolute', top: i * H, left: 0, width: '100%', height: H, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            {/* TYPE above */}
            <div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 56}}>
              <span style={{fontFamily: mono, color: w.accent, fontSize: 52, fontWeight: 700, letterSpacing: 2}}>{w.index}</span>
              <span style={{fontFamily: grotesk, color: bright.ink, fontSize: 108, fontWeight: 700, letterSpacing: -2}}>{w.title}</span>
            </div>

            {/* centered 16:9 footage card */}
            <div style={{width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', border: `2px solid ${bright.line}`, boxShadow: '0 30px 70px rgba(20,12,6,0.4)', position: 'relative'}}>
              <Sequence from={Math.max(0, w.arrive - 24)} durationInFrames={230}>
                <WorldClip src={w.src} rate={w.rate} />
              </Sequence>
              <div style={{position: 'absolute', left: 0, bottom: 0, width: 8, height: '100%', background: w.accent}} />
            </div>

            {/* name/caption below */}
            <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 44, fontWeight: 700, letterSpacing: 6, marginTop: 48, textTransform: 'uppercase'}}>{w.name}</div>
          </div>
        ))}
      </div>

      {/* a thin scroll-progress rail, far right — reinforces "this is scroll" */}
      <ScrollRail frame={frame} />
    </AbsoluteFill>
  );
};

// Sequence-relative fade so the clip eases in (decode) and eases out (wipe),
// never popping or freezing on a hard frame.
const WorldClip: React.FC<{src: string; rate: number}> = ({src, rate}) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 10, 206, 224], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <OffthreadVideo src={staticFile(src)} startFrom={0} playbackRate={rate} muted style={{width: '100%', height: '100%', objectFit: 'cover', opacity: op}} />
  );
};

const ScrollRail: React.FC<{frame: number}> = ({frame}) => {
  const p = interpolate(frame, [0, 720], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', right: 40, top: 160, bottom: 160, width: 4, background: 'rgba(80,58,34,0.18)', borderRadius: 2}}>
      <div style={{position: 'absolute', top: `${p * 100}%`, left: -4, width: 12, height: 12, borderRadius: 12, background: bright.cognac, boxShadow: '0 0 14px rgba(164,101,47,0.5)'}} />
    </div>
  );
};
