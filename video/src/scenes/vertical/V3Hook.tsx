import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../../fonts';
import {bright} from '../../theme';

// Reel3 ACT I — THE HOOK / PAIN (180f), vertical. The alpha signal stated cold:
// AI generates infinite sites and they all look the same. A drifting grid of
// identical generic "sites" sits behind the type, then resolves to the thesis:
// the bottleneck was never code — it's taste. Mirrors the 16:9 ReelHook timing.
export const V3Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const line1 = clip(frame, 6, 26);
  const line2 = clip(frame, 40, 62);
  const painOut = interpolate(frame, [104, 124], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridOp = interpolate(frame, [0, 24, 104, 124], [0, 0.12, 0.12, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridY = interpolate(frame, [0, 180], [60, -120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const eyebrow = clip(frame, 116, 134);
  const taste = clip(frame, 128, 150);
  const tasteScale = interpolate(frame, [128, 158], [0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [166, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out}}>
      {/* identical-sites grid — the sameness, made literal */}
      <div style={{position: 'absolute', inset: 0, opacity: gridOp, transform: `translateY(${gridY}px)`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40, padding: '0 60px', alignContent: 'center'}}>
        {Array.from({length: 12}).map((_, i) => <SameSite key={i} />)}
      </div>

      {/* the pain */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: painOut, padding: '0 60px'}}>
        <div>
          <Mask on={line1}><span style={{fontFamily: grotesk, color: bright.ink, fontSize: 104, fontWeight: 700, letterSpacing: -2, lineHeight: 1.04}}>AI builds every website.</span></Mask>
          <div style={{height: 22}} />
          <Mask on={line2}><span style={{fontFamily: grotesk, color: bright.ink, fontSize: 104, fontWeight: 700, letterSpacing: -2, lineHeight: 1.04}}>It designs <span style={{color: bright.oxblood}}>none</span> of them.</span></Mask>
        </div>
      </AbsoluteFill>

      {/* the turn */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 50px'}}>
        <div style={{opacity: eyebrow, fontFamily: mono, color: bright.inkSoft, fontSize: 34, letterSpacing: 5, marginBottom: 26, lineHeight: 1.4}}>
          GENERATION WAS NEVER<br />THE BOTTLENECK
        </div>
        <div style={{opacity: taste, transform: `scale(${tasteScale})`, fontFamily: grotesk, color: bright.cognac, fontSize: 240, fontWeight: 700, letterSpacing: -6, lineHeight: 1}}>
          Taste is.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SameSite: React.FC = () => (
  <div style={{aspectRatio: '4 / 3', background: bright.card, borderRadius: 10, border: `1px solid ${bright.line}`, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
    <div style={{height: '46%', background: 'linear-gradient(135deg,#9aa0ad,#c7ccd4)'}} />
    <div style={{padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7}}>
      <div style={{height: 8, width: '70%', background: '#cbd0d8', borderRadius: 4}} />
      <div style={{height: 6, width: '90%', background: '#dde1e7', borderRadius: 4}} />
      <div style={{height: 6, width: '55%', background: '#dde1e7', borderRadius: 4}} />
      <div style={{height: 16, width: 60, background: '#9aa0ad', borderRadius: 999, marginTop: 4}} />
    </div>
  </div>
);

const Mask: React.FC<{on: number; children: React.ReactNode}> = ({on, children}) => (
  <div style={{display: 'inline-block', clipPath: `inset(0 ${100 - on * 100}% 0 0)`}}>{children}</div>
);

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
