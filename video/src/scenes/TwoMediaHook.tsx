import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme} from '../theme';
import {grotesk, mono, serif} from '../fonts';
import {Vignette} from '../components/Grain';

// Hook — "ONE CHOREOGRAPHY. TWO MEDIA." with the json chip. 140f.
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const Line: React.FC<{text: string; at: number; accent?: boolean}> = ({text, at, accent}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + 26], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE,
  });
  return (
    <div style={{overflow: 'hidden'}}>
      <div style={{
        transform: `translateY(${(1 - t) * 110}%)`,
        fontFamily: serif, fontWeight: 600, fontSize: 132, lineHeight: 1.02,
        letterSpacing: '0.01em', color: accent ? theme.teal : theme.warm,
      }}>{text}</div>
    </div>
  );
};

export const TwoMediaHook: React.FC = () => {
  const f = useCurrentFrame();
  const chipT = interpolate(f, [62, 86], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE,
  });
  const subT = interpolate(f, [78, 102], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE,
  });
  return (
    <AbsoluteFill style={{background: theme.bgDeep, justifyContent: 'center', padding: 120}}>
      <div style={{fontFamily: mono, fontSize: 20, letterSpacing: '0.32em', color: theme.teal, marginBottom: 36, opacity: interpolate(f, [4, 22], [0, 1], {extrapolateRight: 'clamp'})}}>
        NEW — THE SIGNATURE MECHANIC
      </div>
      <Line text="ONE CHOREOGRAPHY." at={14} />
      <Line text="TWO MEDIA." at={30} accent />
      <div style={{
        marginTop: 48, display: 'inline-flex', alignItems: 'center', gap: 16,
        opacity: chipT, transform: `translateY(${(1 - chipT) * 24}px)`,
      }}>
        <span style={{
          fontFamily: mono, fontSize: 26, color: theme.bgDeep, background: theme.teal,
          padding: '12px 22px', borderRadius: 8, fontWeight: 700,
        }}>scroll-choreography.json</span>
        <span style={{fontFamily: grotesk, fontSize: 26, color: theme.sub, opacity: subT}}>
          → the website <span style={{color: theme.warm}}>and</span> its launch film
        </span>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};
