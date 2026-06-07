import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {theme} from '../theme';
import {grotesk, mono, serif} from '../fonts';
import {Vignette} from '../components/Grain';

// Commands + end card, merged: the three CLI lines, then the closing claim. 240f.
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CMDS = [
  {c: '--target web', d: '→ the scroll page'},
  {c: '--target video', d: '→ the launch film'},
  {c: '--harness', d: '→ watch it move, zero install'},
];

export const TwoMediaEnd: React.FC = () => {
  const f = useCurrentFrame();
  const rule = interpolate(f, [128, 152], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  return (
    <AbsoluteFill style={{background: theme.bgDeep, justifyContent: 'center', padding: 130}}>
      {/* terminal card */}
      <div style={{
        background: theme.bg, border: `1px solid ${theme.line}`, borderRadius: 12, padding: '34px 42px',
        opacity: interpolate(f, [4, 22], [0, 1], {extrapolateRight: 'clamp', easing: EASE}),
      }}>
        {CMDS.map((cmd, i) => {
          const t = interpolate(f, [16 + i * 22, 36 + i * 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
          return (
            <div key={cmd.c} style={{display: 'flex', gap: 18, alignItems: 'baseline', opacity: t, transform: `translateX(${(1 - t) * 24}px)`, marginTop: i ? 18 : 0}}>
              <span style={{fontFamily: mono, fontSize: 27, color: theme.teal}}>$</span>
              <span style={{fontFamily: mono, fontSize: 27, color: theme.warm}}>
                node compile-choreography.mjs scene.json <b style={{color: theme.teal}}>{cmd.c}</b>
              </span>
              <span style={{fontFamily: grotesk, fontSize: 23, color: theme.sub}}>{cmd.d}</span>
            </div>
          );
        })}
      </div>
      {/* the claim */}
      <div style={{marginTop: 70}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{
            fontFamily: serif, fontWeight: 600, fontSize: 88, lineHeight: 1.04, color: theme.warm,
            transform: `translateY(${(1 - interpolate(f, [96, 124], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE})) * 110}%)`,
          }}>
            Rebrand the site. <span style={{color: theme.teal}}>The film follows.</span>
          </div>
        </div>
        <div style={{width: `${rule * 560}px`, height: 3, background: theme.teal, marginTop: 26}} />
        <div style={{
          fontFamily: mono, fontSize: 25, color: theme.sub, marginTop: 24, letterSpacing: '0.04em',
          opacity: interpolate(f, [148, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          github.com/MustBeSimo/cinematic-scroll-skill <span style={{color: theme.teal}}>· MIT · free</span>
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};
