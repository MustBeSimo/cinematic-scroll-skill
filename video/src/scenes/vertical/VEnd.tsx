import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig, spring} from 'remotion';
import {grotesk, mono, serif} from '../../fonts';
import {bright} from '../../theme';

// ACT VI — ONE CTA (51.7–60s), vertical. One high-contrast action (★ Star on
// GitHub) + a big, mobile-legible URL. Installs shrink to one de-emphasized line.
export const VEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const y = interpolate(rise, [0, 1], [28, 0]);
  const rule = interpolate(frame, [10, 30], [0, 320], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const btn = spring({frame: frame - 30, fps, config: {damping: 180}});
  const secondary = interpolate(frame, [54, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', transform: `translateY(${y}px)`, opacity: rise, textAlign: 'center', padding: '0 50px'}}>
      <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 128, fontWeight: 700, letterSpacing: -3, lineHeight: 0.98}}>
        Cinematic<br />Scroll
      </div>
      <div style={{fontFamily: serif, color: bright.inkSoft, fontSize: 54, fontStyle: 'italic', marginTop: 26}}>
        The motion is the constant.<br />The look is yours.
      </div>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 32, letterSpacing: 5, marginTop: 30}}>
        BY SIMONE LEONELLI
      </div>
      <div style={{height: 4, width: rule, background: bright.cognac, marginTop: 36}} />

      {/* one primary action — high contrast, thumb-sized */}
      <div style={{marginTop: 64, transform: `scale(${interpolate(btn, [0, 1], [0.9, 1])})`, opacity: btn}}>
        <div style={{fontFamily: grotesk, fontSize: 60, fontWeight: 700, color: bright.paper, background: bright.ink, padding: '32px 72px', borderRadius: 100, boxShadow: '0 20px 50px rgba(20,12,6,0.3)'}}>
          ★ Star on GitHub
        </div>
      </div>
      <div style={{fontFamily: mono, color: bright.ink, fontSize: 42, fontWeight: 700, letterSpacing: 0.5, marginTop: 40, opacity: btn, lineHeight: 1.3}}>
        github.com/MustBeSimo/<br />cinematic-scroll-skill
      </div>

      {/* installs, de-emphasized to a single line */}
      <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 30, letterSpacing: 2, marginTop: 48, opacity: secondary, lineHeight: 1.5}}>
        free · MIT · install on ClawHub<br />Claude · Hermes · OpenClaw
      </div>
    </AbsoluteFill>
  );
};
