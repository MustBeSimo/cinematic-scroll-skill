import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {mono, serif} from '../../fonts';
import {bright} from '../../theme';

// Reel3 ACT II — THE ENGINE (180f), vertical. What it actually is: a portable
// AGENT SKILL (not an app) any agent can use. The prompt types in, the skill
// engages, agent chips show portability, the one-line install lands. Mirrors the
// 16:9 ReelEngine copy + timing, re-laid-out for mobile-legible type.
const PROMPT = 'build a cinematic scroll site for my launch';
const AGENTS = ['Claude', 'Cursor', 'Hermes', 'OpenClaw'];

export const V3Engine: React.FC = () => {
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
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, padding: '0 60px'}}>
      <div style={{opacity: eyebrow, fontFamily: mono, color: bright.cognac, fontSize: 38, fontWeight: 700, letterSpacing: 6, marginBottom: 40, textAlign: 'center'}}>
        IT'S A SKILL — NOT AN APP
      </div>

      {/* prompt card */}
      <div style={{width: '100%', maxWidth: 960, background: bright.card, border: `1px solid ${bright.line}`, borderRadius: 22, padding: '44px 48px', opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.98, 1])})`, boxShadow: '0 30px 70px rgba(60,40,20,0.16)'}}>
        <div style={{fontFamily: mono, fontSize: 34, color: bright.inkSoft, letterSpacing: 2, marginBottom: 22}}>you, to any coding agent</div>
        <div style={{fontFamily: mono, fontSize: 48, color: bright.ink, lineHeight: 1.4}}>
          <span style={{color: bright.cognac}}>❯ </span>{typed}
          {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, marginTop: 38, opacity: engaged}}>
          <span style={{fontFamily: mono, fontSize: 40, color: '#fff', background: bright.cognac, padding: '12px 24px', borderRadius: 10, fontWeight: 700}}>▸ cinematic-scroll engaged</span>
          <span style={{fontFamily: mono, fontSize: 40, color: bright.inkSoft}}>→ <span style={{color: bright.ink}}>{'{ }'} scroll-choreography.json</span></span>
        </div>
      </div>

      {/* agent chips — portability */}
      <div style={{display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center'}}>
        {AGENTS.map((a, i) => (
          <span key={a} style={{
            opacity: clip(frame, 96 + i * 7, 112 + i * 7),
            fontFamily: mono, fontSize: 34, letterSpacing: 2, color: bright.ink,
            border: `1px solid ${bright.line}`, borderRadius: 999, padding: '12px 28px', background: bright.card,
          }}>{a}</span>
        ))}
      </div>

      {/* install one-liner */}
      <div style={{opacity: install, marginTop: 36, fontFamily: mono, fontSize: 42, color: bright.ink, background: '#1b140d', borderRadius: 12, padding: '18px 30px'}}>
        <span style={{color: '#7C6A52'}}>$ </span><span style={{color: '#F3EBDB'}}>npx cinematic-scroll-skill</span>
      </div>

      <div style={{opacity: kicker, marginTop: 44, fontFamily: serif, fontStyle: 'italic', color: bright.ink, fontSize: 68, fontWeight: 600, textAlign: 'center', lineHeight: 1.1}}>
        Describe the brand.<br /><span style={{color: bright.cognac}}>Get the site.</span>
      </div>
    </AbsoluteFill>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
