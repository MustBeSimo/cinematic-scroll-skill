import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';

const PHASES = ['Cinematic Audit', 'Motion Storyboard', 'Technical Spec', 'Build', 'Polish'];
const DUR = 95;

// Scene 3 (NEW): the 5-phase pipeline — reinforces "process, not just a prompt".
export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [10, 82], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 18% 30%, ${theme.fog} 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
      }}
    >
      <div style={{paddingLeft: 170}}>
        <div style={{fontFamily: mono, color: theme.teal, fontSize: 28, letterSpacing: 8, marginBottom: 38}}>
          THE 5-PHASE PIPELINE
        </div>
        <div style={{position: 'relative'}}>
          {/* progress rail */}
          <div style={{position: 'absolute', left: 27, top: 30, bottom: 30, width: 3, background: theme.line}}>
            <div style={{width: '100%', height: `${fill * 100}%`, background: theme.teal}} />
          </div>
          {PHASES.map((p, i) => {
            const t = interpolate(frame, [14 + i * 11, 14 + i * 11 + 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            const active = fill * 5 >= i + 0.5;
            return (
              <div
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 30,
                  height: 92,
                  opacity: 0.2 + t * 0.8,
                  transform: `translateX(${(1 - t) * 28}px)`,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    border: `2px solid ${active ? theme.teal : theme.line}`,
                    background: active ? theme.teal : 'transparent',
                    color: active ? theme.bgDeep : theme.sub,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: mono,
                    fontSize: 26,
                    fontWeight: 700,
                    zIndex: 1,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{fontFamily: grotesk, color: active ? theme.warm : theme.sub, fontSize: 60, fontWeight: 600}}>
                  {p}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Caption text="process — not just a prompt" dur={DUR} />
    </AbsoluteFill>
  );
};
