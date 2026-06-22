import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {mono, serif} from '../fonts';
import {bright} from '../theme';

// Reel3 Act II — THE ENGINE (180 frames). What it actually is: a portable AGENT
// SKILL (not an app) that any agent can use. The prompt types in, the skill
// engages, the agent chips show portability, and the one-line install lands.
const PROMPT = 'build a cinematic scroll site for my launch';
const AGENTS = ['Claude', 'Cursor', 'Hermes', 'OpenClaw'];

export const ReelEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const eyebrow = clip(frame, 4, 22);
  const card = spring({frame: frame - 8, fps, config: {damping: 200}});
  const chars = Math.floor(interpolate(frame, [24, 80], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const typed = PROMPT.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const done = chars >= PROMPT.length;
  const engaged = clip(frame, 84, 100);
  const install = clip(frame, 120, 138);
  const kicker = clip(frame, 146, 166);
  const out = interpolate(frame, [168, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out}}>
      <div style={{opacity: eyebrow, fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 7, marginBottom: 26}}>
        IT'S A SKILL — NOT AN APP
      </div>

      {/* prompt card */}
      <div style={{width: 1280, background: bright.card, border: `1px solid ${bright.line}`, borderRadius: 18, padding: '34px 42px', opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.97, 1])})`, boxShadow: '0 34px 80px rgba(60,40,20,0.18)'}}>
        <div style={{fontFamily: mono, fontSize: 24, color: bright.inkSoft, letterSpacing: 2, marginBottom: 14}}>you, to any coding agent</div>
        <div style={{fontFamily: mono, fontSize: 42, color: bright.ink, lineHeight: 1.35}}>
          <span style={{color: bright.cognac}}>❯ </span>{typed}
          {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 26, opacity: engaged}}>
          <span style={{fontFamily: mono, fontSize: 28, color: '#fff', background: bright.cognac, padding: '8px 18px', borderRadius: 8, fontWeight: 700}}>▸ cinematic-scroll engaged</span>
          <span style={{fontFamily: mono, fontSize: 30, color: bright.inkSoft}}>→ <span style={{color: bright.ink}}>{'{ }'} scroll-choreography.json</span></span>
        </div>
      </div>

      {/* agent chips — portability */}
      <div style={{display: 'flex', gap: 14, marginTop: 30}}>
        {AGENTS.map((a, i) => (
          <span key={a} style={{
            opacity: clip(frame, 96 + i * 7, 112 + i * 7),
            fontFamily: mono, fontSize: 24, letterSpacing: 2, color: bright.ink,
            border: `1px solid ${bright.line}`, borderRadius: 999, padding: '10px 22px', background: bright.card,
          }}>{a}</span>
        ))}
      </div>

      {/* install one-liner */}
      <div style={{opacity: install, marginTop: 30, fontFamily: mono, fontSize: 30, background: '#F1EEE4', borderRadius: 10, padding: '14px 24px'}}>
        <span style={{color: '#8A90D8'}}>$ </span><span style={{color: '#1E26EB'}}>npx cinematic-scroll-skill</span>
      </div>

      <div style={{opacity: kicker, marginTop: 30, fontFamily: serif, fontStyle: 'italic', color: bright.ink, fontSize: 52, fontWeight: 600}}>
        Describe the brand. <span style={{color: bright.cognac}}>Get the site.</span>
      </div>
    </AbsoluteFill>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
