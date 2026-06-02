import React from 'react';
import {AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';

// Scene 5 (432–480): the end card — name, install command, url.
export const EndCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const y = interpolate(rise, [0, 1], [30, 0]);
  const cursorOn = Math.floor(frame / 9) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 40%, ${theme.fog} 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
        alignItems: 'center',
        transform: `translateY(${y}px)`,
        opacity: rise,
      }}
    >
      <div style={{fontFamily: mono, color: theme.teal, fontSize: 26, letterSpacing: 8, marginBottom: 26}}>
        FREE · MIT · CLAUDE · CURSOR · HERMES
      </div>
      <div style={{fontFamily: grotesk, color: theme.warm, fontSize: 150, fontWeight: 700, letterSpacing: -3}}>
        Cinematic Scroll
      </div>
      <div style={{fontFamily: grotesk, color: theme.sub, fontSize: 44, fontWeight: 500, marginTop: 6}}>
        The motion is the constant. The look is yours.
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: mono,
          fontSize: 38,
          color: theme.warm,
          background: 'rgba(8,16,18,0.8)',
          border: `1px solid ${theme.line}`,
          borderRadius: 12,
          padding: '18px 30px',
        }}
      >
        <span style={{color: theme.teal}}>$</span> npx cinematic-scroll-skill
        <span style={{opacity: cursorOn ? 1 : 0, color: theme.teal}}> ▌</span>
      </div>
      <div style={{fontFamily: mono, color: theme.sub, fontSize: 28, letterSpacing: 2, marginTop: 30}}>
        mustbesimo.github.io/cinematic-scroll-skill
      </div>
    </AbsoluteFill>
  );
};
