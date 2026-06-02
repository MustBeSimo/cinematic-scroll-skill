import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';

// Vertical clip-path mask-wipe title reveal — the signature noir move.
// Reveals top→bottom while easing up slightly.
export const MaskWipeTitle: React.FC<{
  text: string;
  startAt?: number;
  fontFamily: string;
  color: string;
  size?: number;
  weight?: number;
  letterSpacing?: number;
}> = ({text, startAt = 0, fontFamily, color, size = 180, weight = 700, letterSpacing = -2}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startAt, startAt + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const y = interpolate(p, [0, 1], [40, 0]);
  return (
    <div
      style={{
        clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`,
        transform: `translateY(${y}px)`,
        fontFamily,
        color,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 0.92,
        letterSpacing,
        textTransform: 'uppercase',
        willChange: 'clip-path, transform',
      }}
    >
      {text}
    </div>
  );
};
