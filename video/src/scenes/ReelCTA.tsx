import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// Reel3 Act VI — THE CLOSE (180 frames). Comprehensive payoff: free + MIT +
// open, the one-line install (two channels), portable across agents, the moat
// line, and the credit/links. Clean editorial — deliberate contrast to the
// motion that came before.
export const ReelCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const badge = clip(frame, 4, 22);
  const gen = clip(frame, 26, 44);
  const moat = spring({frame: frame - 44, fps, config: {damping: 200}});
  const moatY = interpolate(moat, [0, 1], [24, 0]);
  const cmds = clip(frame, 70, 88);
  const agents = clip(frame, 92, 110);
  const credit = clip(frame, 120, 140);
  const out = interpolate(frame, [168, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: out}}>
      <div style={{opacity: badge, fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 7, marginBottom: 22}}>
        FREE · MIT · OPEN ON PURPOSE
      </div>

      <div style={{opacity: gen, fontFamily: mono, color: bright.inkSoft, fontSize: 34, letterSpacing: 2}}>
        Generation is getting cheap.
      </div>
      <div style={{opacity: moat, transform: `translateY(${moatY}px)`, fontFamily: grotesk, color: bright.ink, fontSize: 132, fontWeight: 700, letterSpacing: -3, lineHeight: 1, marginTop: 6}}>
        Taste is the <span style={{color: bright.cognac}}>moat.</span>
      </div>

      {/* install — two channels */}
      <div style={{opacity: cmds, display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center'}}>
        <span style={{fontFamily: mono, fontSize: 26, background: '#1b140d', color: '#F3EBDB', borderRadius: 9, padding: '12px 20px'}}>
          <span style={{color: '#7C6A52'}}>$ </span>npx cinematic-scroll-skill
        </span>
        <span style={{fontFamily: mono, fontSize: 26, background: '#1b140d', color: '#F3EBDB', borderRadius: 9, padding: '12px 20px'}}>
          <span style={{color: '#7C6A52'}}>$ </span>clawhub install cinematic-scroll
        </span>
      </div>

      <div style={{opacity: agents, marginTop: 22, fontFamily: mono, fontSize: 22, letterSpacing: 3, color: bright.inkSoft}}>
        CLAUDE · CURSOR · HERMES · OPENCLAW
      </div>

      <div style={{opacity: credit, marginTop: 44}}>
        <div style={{fontFamily: serif, fontStyle: 'italic', color: bright.ink, fontSize: 40}}>cinematic-scroll</div>
        <div style={{fontFamily: mono, fontSize: 20, letterSpacing: 3, color: bright.inkSoft, marginTop: 8}}>
          github.com/MustBeSimo · w230.net
        </div>
        <div style={{fontFamily: mono, fontSize: 16, letterSpacing: 4, color: bright.cognac, marginTop: 14}}>BY SIMONE LEONELLI</div>
      </div>
    </AbsoluteFill>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
