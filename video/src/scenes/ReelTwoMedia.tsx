import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// 47–53s, bright editorial. The kicker: the same scroll-choreography.json
// compiles to BOTH the website AND the launch film — the very video you're
// watching. HTML is the new After Effects.
export const ReelTwoMedia: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame: frame - 6, fps, config: {damping: 200}});
  const split = spring({frame: frame - 36, fps, config: {damping: 200}});
  const gap = interpolate(split, [0, 1], [6, 30]);
  const panelFade = interpolate(frame, [36, 56], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kicker = interpolate(frame, [86, 106], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kickerY = interpolate(frame, [86, 106], [20, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outFade = interpolate(frame, [166, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: outFade}}
    >
      <div style={{opacity: rise, transform: `translateY(${interpolate(rise, [0, 1], [18, 0])}px)`, marginBottom: 38}}>
        <div
          style={{
            fontFamily: mono, fontSize: 34, color: bright.ink,
            background: bright.card, border: `1px solid ${bright.line}`,
            borderRadius: 12, padding: '16px 30px', boxShadow: '0 18px 44px rgba(60,40,20,0.14)',
          }}
        >
          <span style={{color: bright.cognac}}>{'{ }'}</span> scroll-choreography.json
        </div>
      </div>

      <div style={{display: 'flex', gap: gap * 2, opacity: panelFade}}>
        <Panel label="WEBSITE" sub="GSAP · ScrollTrigger" />
        <Panel label="LAUNCH FILM" sub="deterministic MP4" highlight />
      </div>

      <div style={{fontFamily: serif, color: bright.ink, fontSize: 50, fontWeight: 600, marginTop: 46, opacity: kicker, transform: `translateY(${kickerY}px)`, textAlign: 'center'}}>
        One file. Both. <span style={{fontStyle: 'italic', color: bright.cognac}}>This video was compiled from it.</span>
      </div>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{label: string; sub: string; highlight?: boolean}> = ({label, sub, highlight}) => (
  <div
    style={{
      width: 440, height: 196,
      border: `1.5px solid ${highlight ? bright.cognac : bright.line}`,
      borderRadius: 16,
      background: highlight ? 'rgba(164,101,47,0.07)' : bright.card,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}
  >
    <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 40, fontWeight: 700, letterSpacing: -1}}>{label}</div>
    <div style={{fontFamily: mono, color: highlight ? bright.cognac : bright.inkSoft, fontSize: 21, letterSpacing: 3, marginTop: 10}}>{sub}</div>
  </div>
);
