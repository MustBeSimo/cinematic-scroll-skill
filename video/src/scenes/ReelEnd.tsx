import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// ACT VI — ONE CTA (51.7–60s). Three competing install commands = paralysis.
// One high-contrast action (Star on GitHub, the universal funnel) + a big,
// mobile-legible URL. The install paths shrink to one de-emphasized line.
export const ReelEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const y = interpolate(rise, [0, 1], [26, 0]);
  const rule = interpolate(frame, [10, 30], [0, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const btn = spring({frame: frame - 30, fps, config: {damping: 180}});
  const secondary = interpolate(frame, [54, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', transform: `translateY(${y}px)`, opacity: rise}}>
      <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 130, fontWeight: 700, letterSpacing: -3, lineHeight: 1}}>
        Cinematic Scroll
      </div>
      <div style={{fontFamily: serif, color: bright.inkSoft, fontSize: 46, fontStyle: 'italic', marginTop: 12}}>
        The motion is the constant. The look is yours.
      </div>
      <div style={{height: 3, width: rule, background: bright.cognac, marginTop: 28}} />

      {/* one primary action — high contrast, thumb-sized */}
      <div style={{marginTop: 46, transform: `scale(${interpolate(btn, [0, 1], [0.9, 1])})`, opacity: btn}}>
        <div style={{fontFamily: grotesk, fontSize: 44, fontWeight: 700, color: bright.paper, background: bright.ink, padding: '24px 56px', borderRadius: 100, boxShadow: '0 20px 50px rgba(20,12,6,0.3)'}}>
          ★ Star on GitHub
        </div>
      </div>
      <div style={{fontFamily: mono, color: bright.ink, fontSize: 38, fontWeight: 700, letterSpacing: 1, marginTop: 26, opacity: btn}}>
        github.com/MustBeSimo/cinematic-scroll-skill
      </div>

      {/* installs, de-emphasized to a single line */}
      <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 25, letterSpacing: 3, marginTop: 34, opacity: secondary}}>
        free · MIT · install on ClawHub · Claude · Hermes · OpenClaw
      </div>
    </AbsoluteFill>
  );
};
