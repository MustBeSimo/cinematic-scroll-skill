import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// ACT II — THE AGENT (6–14s). The unique framing the old cut abandoned: this
// is a SKILL for coding agents, not a manual library. Describe the brand, the
// agent writes the choreography. Ties back to Act I's JSON.
const PROMPT = 'quiet luxury launch — warm cream, 5 chapters';

export const ReelAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const card = spring({frame: frame - 6, fps, config: {damping: 200}});
  const chars = Math.floor(interpolate(frame, [22, 92], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const typed = PROMPT.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const done = chars >= PROMPT.length;

  const skillTag = interpolate(frame, [100, 116], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const arrow = interpolate(frame, [120, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kicker = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kickerY = interpolate(frame, [150, 172], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [206, 220], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 6, marginBottom: 26, opacity: card}}>
        IT'S A SKILL — NOT A LIBRARY
      </div>

      <div style={{width: 1240, background: bright.card, border: `1px solid ${bright.line}`, borderRadius: 18, padding: '34px 40px', opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.98, 1])})`, boxShadow: '0 30px 70px rgba(60,40,20,0.16)'}}>
        <div style={{fontFamily: mono, fontSize: 26, color: bright.inkSoft, letterSpacing: 2, marginBottom: 14}}>you, to Claude / Cursor / Hermes</div>
        <div style={{fontFamily: mono, fontSize: 40, color: bright.ink, lineHeight: 1.4}}>
          <span style={{color: bright.cognac}}>❯ </span>{typed}
          {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 26, opacity: skillTag}}>
          <span style={{fontFamily: mono, fontSize: 30, color: '#fff', background: bright.cognac, padding: '8px 18px', borderRadius: 8, fontWeight: 700}}>▸ cinematic-scroll skill engaged</span>
          <span style={{fontFamily: mono, fontSize: 34, color: bright.inkSoft, opacity: arrow}}>→ <span style={{color: bright.ink}}>{'{ }'} scroll-choreography.json</span></span>
        </div>
      </div>

      <div style={{fontFamily: serif, color: bright.ink, fontSize: 56, fontWeight: 600, marginTop: 44, opacity: kicker, transform: `translateY(${kickerY}px)`}}>
        Describe the brand. <span style={{fontStyle: 'italic', color: bright.cognac}}>Get the site.</span>
      </div>
    </AbsoluteFill>
  );
};
