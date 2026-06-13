import React from 'react';
import {AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// ACT III — THE RANGE (14–38s). Four clashing aesthetics from one engine.
// The worlds are stacked vertically and the viewport SCROLLS through them —
// the transition literally demonstrates the product (the critique's best note).
// Four, not five: range stays legible, each gets ~5s to read.
const H = 1080;

// On-screen order: moody → warm → calm → vibrant (ends with energy into 3D).
const WORLDS = [
  {src: 'footage/noir.mp4',        arrive: 0,   rate: 0.70, index: '01', title: 'VANTASCOPE',     name: 'Sci-fi noir',           accent: '#E8484F'},
  {src: 'footage/renaissance.mp4', arrive: 156, rate: 0.70, index: '02', title: 'CLASSIC TOUCH',  name: 'Renaissance editorial', accent: '#B6892F'},
  {src: 'footage/luxe.mp4',        arrive: 336, rate: 0.82, index: '03', title: 'MAISON SOLENNE', name: 'Quiet luxury',          accent: '#A4652F'},
  {src: 'footage/pop.mp4',         arrive: 516, rate: 0.62, index: '04', title: 'BLOOM',           name: 'Gen-Z pop',             accent: '#FF2E93'},
];

export const ReelWorlds: React.FC = () => {
  const frame = useCurrentFrame();
  // dwell ~156f on each world, then an EASED scroll-wipe to the next. Each wipe
  // is a smooth accelerate→decelerate scroll (not a linear mechanical slide, not
  // a glitchy crossfade) — the transition itself reads as a real page scroll.
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
          <div key={w.src} style={{position: 'absolute', top: i * H, left: 0, width: '100%', height: H, overflow: 'hidden'}}>
            <Sequence from={Math.max(0, w.arrive - 24)} durationInFrames={230}>
              <OffthreadVideo src={staticFile(w.src)} startFrom={0} playbackRate={w.rate} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
            {/* big, mobile-legible label card */}
            <div style={{position: 'absolute', left: 80, bottom: 96, background: bright.card, borderLeft: `6px solid ${w.accent}`, borderRadius: 5, padding: '24px 36px 24px 30px', boxShadow: '0 26px 64px rgba(20,12,6,0.5)'}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
                <span style={{fontFamily: mono, color: w.accent, fontSize: 30, fontWeight: 700, letterSpacing: 2}}>{w.index}</span>
                <span style={{fontFamily: grotesk, color: bright.ink, fontSize: 64, fontWeight: 700, letterSpacing: -1}}>{w.title}</span>
              </div>
              <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 28, fontWeight: 700, letterSpacing: 4, marginTop: 8, textTransform: 'uppercase'}}>{w.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* a thin scroll-progress rail, far right — reinforces "this is scroll" */}
      <ScrollRail frame={frame} />
    </AbsoluteFill>
  );
};

const ScrollRail: React.FC<{frame: number}> = ({frame}) => {
  const p = interpolate(frame, [0, 720], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', right: 54, top: 120, bottom: 120, width: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2}}>
      <div style={{position: 'absolute', top: `${p * 100}%`, left: -3, width: 9, height: 9, borderRadius: 9, background: '#fff', boxShadow: '0 0 12px rgba(255,255,255,0.6)'}} />
    </div>
  );
};
