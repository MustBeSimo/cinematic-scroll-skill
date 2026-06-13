import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// R2 Act II — AGENT (220 frames). Live footage plays behind the prompt text from
// frame 0 — no pure-text slide. renaissance.mp4 at reduced opacity so the text
// reads clearly while the scroll motion stays visible.
const PROMPT = 'build a cinematic scroll site for my product launch';

export const R2Agent: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const bgPan = interpolate(frame, [0, 220], [64, -64], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const card  = spring({frame: frame - 6, fps, config: {damping: 200}});
  const chars = Math.floor(interpolate(frame, [22, 92], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const typed = PROMPT.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const done = chars >= PROMPT.length;

  const skillTag  = interpolate(frame, [100, 116], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const arrow     = interpolate(frame, [120, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kicker    = interpolate(frame, [150, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kickerY   = interpolate(frame, [150, 172], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out       = interpolate(frame, [206, 220], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{opacity: out}}>
      {/* live footage background — always scrolling */}
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile('footage/renaissance.mp4')}
          startFrom={0}
          playbackRate={0.6}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.24) translateY(${bgPan}px)`}}
        />
      </AbsoluteFill>
      {/* gradient scrim — light through the middle band so the renaissance scroll motion
          stays clearly visible; heavier at top/bottom only where the mono + serif text sit */}
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(245,241,234,0.62) 0%, rgba(245,241,234,0.40) 30%, rgba(245,241,234,0.40) 64%, rgba(245,241,234,0.66) 100%)'}} />

      {/* content */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 6, marginBottom: 26, opacity: card}}>
          IT'S A SKILL — NOT A LIBRARY
        </div>

        <div style={{width: 1240, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', border: `1px solid ${bright.line}`, borderRadius: 18, padding: '34px 40px', opacity: card, transform: `scale(${interpolate(card, [0, 1], [0.98, 1])})`, boxShadow: '0 30px 70px rgba(60,40,20,0.14)'}}>
          <div style={{fontFamily: mono, fontSize: 26, color: bright.inkSoft, letterSpacing: 2, marginBottom: 14}}>you, to Claude / Cursor / Hermes</div>
          <div style={{fontFamily: mono, fontSize: 40, color: bright.ink, lineHeight: 1.4}}>
            <span style={{color: bright.cognac}}>❯ </span>{typed}
            {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 26, opacity: skillTag}}>
            <span style={{fontFamily: mono, fontSize: 30, color: '#fff', background: bright.cognac, padding: '8px 18px', borderRadius: 8, fontWeight: 700}}>▸ cinematic-scroll skill engaged</span>
            <span style={{fontFamily: mono, fontSize: 32, color: bright.inkSoft, opacity: arrow}}>→ <span style={{color: bright.ink}}>{'{ }'} scroll-choreography.json</span></span>
          </div>
        </div>

        <div style={{fontFamily: serif, color: bright.ink, fontSize: 56, fontWeight: 600, marginTop: 44, opacity: kicker, transform: `translateY(${kickerY}px)`}}>
          Describe the brand. <span style={{fontStyle: 'italic', color: bright.cognac}}>Get the site.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
