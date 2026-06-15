import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../../fonts';
import {bright} from '../../theme';

// Reel3 ACT VI — THE CLOSE (180f), vertical. Comprehensive payoff: free + MIT +
// open, the one-line install (two channels), portable across agents, the moat
// line, and credit/links. Clean editorial — deliberate calm after the motion.
// Mirrors the 16:9 ReelCTA copy + timing, stacked for mobile.
export const V3CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const badge = clip(frame, 4, 22);
  const gen = clip(frame, 26, 44);
  const moat = spring({frame: frame - 44, fps, config: {damping: 200}});
  const moatY = interpolate(moat, [0, 1], [28, 0]);
  const cmds = clip(frame, 70, 88);
  const agents = clip(frame, 92, 110);
  const credit = clip(frame, 120, 140);
  const out = interpolate(frame, [168, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: out, padding: '0 50px'}}>
      <div style={{opacity: badge, fontFamily: mono, color: bright.cognac, fontSize: 34, fontWeight: 700, letterSpacing: 6, marginBottom: 28}}>
        FREE · MIT · OPEN ON PURPOSE
      </div>

      <div style={{opacity: gen, fontFamily: mono, color: bright.inkSoft, fontSize: 42, letterSpacing: 1}}>
        Generation is getting cheap.
      </div>
      <div style={{opacity: moat, transform: `translateY(${moatY}px)`, fontFamily: grotesk, color: bright.ink, fontSize: 168, fontWeight: 700, letterSpacing: -4, lineHeight: 0.98, marginTop: 12}}>
        Taste is the <span style={{color: bright.cognac}}>moat.</span>
      </div>

      {/* install — two channels, stacked */}
      <div style={{opacity: cmds, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48, alignItems: 'center'}}>
        <span style={{fontFamily: mono, fontSize: 36, background: '#1b140d', color: '#F3EBDB', borderRadius: 11, padding: '16px 26px'}}>
          <span style={{color: '#7C6A52'}}>$ </span>npx cinematic-scroll-skill
        </span>
        <span style={{fontFamily: mono, fontSize: 36, background: '#1b140d', color: '#F3EBDB', borderRadius: 11, padding: '16px 26px'}}>
          <span style={{color: '#7C6A52'}}>$ </span>clawhub install cinematic-scroll
        </span>
      </div>

      <div style={{opacity: agents, marginTop: 30, fontFamily: mono, fontSize: 30, letterSpacing: 3, color: bright.inkSoft}}>
        CLAUDE · CURSOR · HERMES · OPENCLAW
      </div>

      <div style={{opacity: credit, marginTop: 56}}>
        <div style={{fontFamily: serif, fontStyle: 'italic', color: bright.ink, fontSize: 58}}>cinematic-scroll</div>
        <div style={{fontFamily: mono, fontSize: 28, letterSpacing: 2, color: bright.inkSoft, marginTop: 12, lineHeight: 1.4}}>
          github.com/MustBeSimo<br />w230.net
        </div>
        <div style={{fontFamily: mono, fontSize: 24, letterSpacing: 4, color: bright.cognac, marginTop: 18}}>BY SIMONE LEONELLI</div>
      </div>
    </AbsoluteFill>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
