import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {mono, serif} from '../../fonts';
import {bright} from '../../theme';

// ACT II — THE AGENT (6–14s), vertical. It's a SKILL, not a library. Describe
// the brand in a terminal card; the agent writes the choreography JSON.
// Generic on purpose: the montage shows RANGE, so the prompt shouldn't imply
// one specific aesthetic (a "quiet luxury" prompt clashed with noir leading).
const PROMPT = 'build a cinematic scroll site for my product launch';

export const VAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const card = spring({frame: frame - 6, fps, config: {damping: 200}});
  const chars = Math.floor(interpolate(frame, [22, 92], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const typed = PROMPT.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const done = chars >= PROMPT.length;

  const skillTag = interpolate(frame, [100, 116], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const arrow = interpolate(frame, [122, 142], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kicker = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kickerY = interpolate(frame, [150, 172], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [206, 220], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, padding: '0 60px'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 38, fontWeight: 700, letterSpacing: 6, marginBottom: 40, opacity: card, textAlign: 'center'}}>
        IT'S A SKILL — NOT A LIBRARY
      </div>

      <div style={{width: '100%', maxWidth: 960, background: bright.card, border: `1px solid ${bright.line}`, borderRadius: 22, padding: '44px 48px', opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.98, 1])})`, boxShadow: '0 30px 70px rgba(60,40,20,0.16)'}}>
        <div style={{fontFamily: mono, fontSize: 34, color: bright.inkSoft, letterSpacing: 2, marginBottom: 22}}>you, to Claude / Cursor / Hermes</div>
        <div style={{fontFamily: mono, fontSize: 46, color: bright.ink, lineHeight: 1.45}}>
          <span style={{color: bright.cognac}}>❯ </span>{typed}
          {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
        </div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, marginTop: 38, opacity: skillTag}}>
          <span style={{fontFamily: mono, fontSize: 40, color: '#fff', background: bright.cognac, padding: '12px 24px', borderRadius: 10, fontWeight: 700}}>▸ cinematic-scroll skill engaged</span>
          <span style={{fontFamily: mono, fontSize: 40, color: bright.inkSoft, opacity: arrow}}>→ <span style={{color: bright.ink}}>{'{ }'} scroll-choreography.json</span></span>
        </div>
      </div>

      <div style={{fontFamily: serif, color: bright.ink, fontSize: 72, fontWeight: 600, marginTop: 60, opacity: kicker, transform: `translateY(${kickerY}px)`, textAlign: 'center'}}>
        Describe the brand.<br /><span style={{fontStyle: 'italic', color: bright.cognac}}>Get the site.</span>
      </div>
    </AbsoluteFill>
  );
};
