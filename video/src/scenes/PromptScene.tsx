import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';

const BRIEF = 'a cinematic scroll page for a sci-fi game — teal fog, crimson edge-light, 4 chapters';

// Scene 1 (0–90): a human types one sentence into the agent.
export const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.floor(
    interpolate(frame, [14, 92], [0, BRIEF.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const shown = BRIEF.slice(0, chars);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  const cardY = interpolate(frame, [0, 18], [40, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const cardO = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${theme.fog} 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 1180,
          transform: `translateY(${cardY}px)`,
          opacity: cardO,
          border: `1px solid ${theme.line}`,
          borderRadius: 16,
          background: 'rgba(8,16,18,0.72)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
          padding: '40px 48px',
        }}
      >
        <div style={{fontFamily: mono, color: theme.sub, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>
          YOU<span style={{color: theme.teal}}> →</span> CLAUDE
        </div>
        <div style={{fontFamily: grotesk, color: theme.warm, fontSize: 52, lineHeight: 1.32, fontWeight: 500}}>
          {shown}
          <span style={{opacity: cursorOn ? 1 : 0, color: theme.teal}}>▌</span>
        </div>
      </div>
      <Caption text="one sentence →" dur={110} />
    </AbsoluteFill>
  );
};
