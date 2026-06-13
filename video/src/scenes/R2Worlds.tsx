import React from 'react';
import {AbsoluteFill, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// R2 Act III — THE RANGE (5 worlds). Extends ReelWorlds with a fifth world
// (flagship footage, labelled as the 3D/immersive world) so the range claim
// is backed by 5 distinct clips. Identical scroll-wipe mechanic: the viewport
// scrolls through all 5 in sequence; every clip is always in motion.
const H = 1080;

const WORLDS = [
  {src: 'footage/noir.mp4',        arrive: 0,   rate: 0.60, index: '01', title: 'VANTASCOPE',     name: 'Signal clean',          accent: '#E23A4E'},
  {src: 'footage/renaissance.mp4', arrive: 156, rate: 0.60, index: '02', title: 'CLASSIC TOUCH',  name: 'Renaissance editorial', accent: '#B6892F'},
  {src: 'footage/luxe.mp4',        arrive: 336, rate: 0.74, index: '03', title: 'MAISON SOLENNE', name: 'Quiet luxury',          accent: '#A4652F'},
  {src: 'footage/pop.mp4',         arrive: 516, rate: 0.54, index: '04', title: 'BLOOM',           name: 'Gen-Z pop',             accent: '#FF2E93'},
  {src: 'footage/flagship-ride.mp4', arrive: 696, rate: 0.55, index: '05', title: 'NEXUS LAB',       name: '3D / Immersive',        accent: '#4F3FFF'},
];

export const R2Worlds: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);
  const step = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  // 5 worlds: 4 scroll-wipes
  const y = -H * (step(156, 184) + step(336, 364) + step(516, 544) + step(696, 724));
  const tail = interpolate(frame, [866, 880], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: 5 * H, transform: `translateY(${y}px)`}}>
        {WORLDS.map((w, i) => (
          <div key={w.src} style={{position: 'absolute', top: i * H, left: 0, width: '100%', height: H, overflow: 'hidden'}}>
            <Sequence from={Math.max(0, w.arrive - 24)} durationInFrames={260}>
              <WorldClip src={w.src} rate={w.rate} />
            </Sequence>
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
      <ScrollRail frame={frame} total={880} />
    </AbsoluteFill>
  );
};

const WorldClip: React.FC<{src: string; rate: number}> = ({src, rate}) => {
  const f = useCurrentFrame();
  const op  = interpolate(f, [0, 10, 240, 258], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pan = interpolate(f, [0, 260], [70, -70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={0}
      playbackRate={rate}
      muted
      style={{width: '100%', height: '100%', objectFit: 'cover', opacity: op, transform: `scale(1.22) translateY(${pan}px)`}}
    />
  );
};

const ScrollRail: React.FC<{frame: number; total: number}> = ({frame, total}) => {
  const p = interpolate(frame, [0, total], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', right: 54, top: 120, bottom: 120, width: 3, background: 'rgba(255,255,255,0.25)', borderRadius: 2}}>
      <div style={{position: 'absolute', top: `${p * 100}%`, left: -3, width: 9, height: 9, borderRadius: 9, background: '#fff', boxShadow: '0 0 12px rgba(255,255,255,0.6)'}} />
    </div>
  );
};
