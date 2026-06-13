import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// 53–60s, bright editorial end card: the thesis, every install surface, links.
const INSTALLS = [
  {tag: 'ClawHub', cmd: 'openclaw skills install cinematic-scroll'},
  {tag: 'Claude', cmd: '/plugin install cinematic-scroll@mustbesimo'},
  {tag: 'Hermes', cmd: 'hermes skills install MustBeSimo/cinematic-scroll-skill'},
];

export const ReelEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const y = interpolate(rise, [0, 1], [26, 0]);
  const rule = interpolate(frame, [10, 30], [0, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', transform: `translateY(${y}px)`, opacity: rise}}
    >
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 23, letterSpacing: 7, marginBottom: 18}}>
        FREE · MIT · CLAUDE · CURSOR · HERMES · OPENCLAW
      </div>
      <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 124, fontWeight: 700, letterSpacing: -3, lineHeight: 1}}>
        Cinematic Scroll
      </div>
      <div style={{fontFamily: serif, color: bright.inkSoft, fontSize: 42, fontStyle: 'italic', fontWeight: 500, marginTop: 10}}>
        The motion is the constant. The look is yours.
      </div>
      <div style={{height: 3, width: rule, background: bright.cognac, marginTop: 30}} />

      <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 38}}>
        {INSTALLS.map((it, i) => {
          const op = interpolate(frame, [20 + i * 8, 34 + i * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={it.tag}
              style={{
                display: 'flex', alignItems: 'center', gap: 26, opacity: op,
                fontFamily: mono, fontSize: 25,
                background: bright.card, border: `1px solid ${bright.line}`,
                borderRadius: 10, padding: '13px 26px', width: 900,
                boxShadow: '0 10px 30px rgba(60,40,20,0.10)',
              }}
            >
              <span style={{color: bright.cognac, width: 132, flexShrink: 0, letterSpacing: 2, fontWeight: 700}}>{it.tag}</span>
              <span style={{color: bright.ink, whiteSpace: 'nowrap'}}>{it.cmd}</span>
            </div>
          );
        })}
      </div>

      <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 25, letterSpacing: 2, marginTop: 32}}>
        github.com/MustBeSimo/cinematic-scroll-skill
      </div>
    </AbsoluteFill>
  );
};
