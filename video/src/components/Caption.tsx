import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {mono} from '../fonts';
import {theme} from '../theme';

// Lower-third caption. Lives inside a <Sequence>, so `frame` is local.
// Fades in over 10f, holds, fades out over the last 10f of `dur`.
export const Caption: React.FC<{text: string; dur: number; accent?: string}> = ({text, dur, accent}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [0, 14], [16, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 84,
        bottom: 96,
        opacity,
        transform: `translateY(${y}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: mono,
      }}
    >
      <span style={{width: 30, height: 2, background: accent ?? theme.teal, display: 'inline-block'}} />
      <span style={{color: theme.warm, fontSize: 30, letterSpacing: 1, fontWeight: 700}}>{text}</span>
    </div>
  );
};
