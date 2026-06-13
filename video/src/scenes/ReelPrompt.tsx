import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {mono, serif} from '../fonts';
import {bright} from '../theme';

// 5–12s, bright editorial. A single natural-language prompt typed into a clean
// card, then a warm sweep "compiles" it. One sentence in, a cinematic site out.
const PROMPT = 'build a cinematic scroll site for my product launch';

export const ReelPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chars = Math.floor(interpolate(frame, [12, 96], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const typed = PROMPT.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const done = chars >= PROMPT.length;

  const enter = spring({frame: frame - 8, fps, config: {damping: 200}});
  const sweep = interpolate(frame, [120, 178], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kicker = interpolate(frame, [150, 174], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kickerY = interpolate(frame, [150, 174], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outFade = interpolate(frame, [198, 210], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bright.paper,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: outFade,
      }}
    >
      <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 22, letterSpacing: 6, marginBottom: 28, opacity: enter}}>
        YOU, TO YOUR CODING AGENT
      </div>

      <div
        style={{
          width: 1200,
          background: bright.card,
          border: `1px solid ${bright.line}`,
          borderRadius: 18,
          padding: '36px 44px',
          position: 'relative',
          overflow: 'hidden',
          transform: `scale(${interpolate(enter, [0, 1], [0.98, 1])})`,
          opacity: enter,
          boxShadow: '0 30px 70px rgba(60,40,20,0.16)',
        }}
      >
        <div style={{fontFamily: mono, fontSize: 40, color: bright.ink, lineHeight: 1.4}}>
          <span style={{color: bright.cognac}}>❯ </span>
          {typed}
          {!done && <span style={{opacity: cursorOn ? 1 : 0, color: bright.cognac}}>▌</span>}
        </div>
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: `${sweep}%`, width: 140,
            background: `linear-gradient(90deg, transparent, ${bright.brass}, transparent)`,
            opacity: 0.22, pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{fontFamily: serif, color: bright.ink, fontSize: 56, fontWeight: 600, marginTop: 44, opacity: kicker, transform: `translateY(${kickerY}px)`}}>
        One sentence in. <span style={{fontStyle: 'italic', color: bright.cognac}}>A cinematic site out.</span>
      </div>
    </AbsoluteFill>
  );
};
