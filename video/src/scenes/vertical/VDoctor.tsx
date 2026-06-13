import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, Series, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../../fonts';
import {bright} from '../../theme';

// ACT V — THE DOCTOR, LABELED (45.7–51.7s), vertical. The skill grades its OWN
// taste and blocks anything under 80. Bridge card → doctor footage (startFrom
// 270) in a centered 16:9 card with the who/what/why stacked above/below.
export const VDoctor: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={44}>
      <Bridge />
    </Series.Sequence>
    <Series.Sequence durationInFrames={136}>
      <Clip />
    </Series.Sequence>
  </Series>
);

const Bridge: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const out = interpolate(frame, [30, 44], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, textAlign: 'center', padding: '0 70px'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 38, fontWeight: 700, letterSpacing: 7, opacity: rise}}>AND IT GRADES ITSELF</div>
      <div style={{fontFamily: serif, color: bright.ink, fontSize: 108, fontWeight: 600, lineHeight: 1.05, marginTop: 22, transform: `translateY(${interpolate(rise, [0, 1], [22, 0])}px)`}}>
        Taste, as a <span style={{fontStyle: 'italic', color: bright.cognac}}>number you can gate on.</span>
      </div>
    </AbsoluteFill>
  );
};

const CARD_W = 1000;
const CARD_H = Math.round((CARD_W * 9) / 16); // 562

const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 136;
  const fade = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap = interpolate(frame, [16, 32, d - 24, d - 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#05080A', opacity: fade, justifyContent: 'center', alignItems: 'center'}}>
      {/* who / what / why above */}
      <div style={{textAlign: 'center', marginBottom: 52, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 40, fontWeight: 700, letterSpacing: 4}}>CINEMATIC-DOCTOR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 50, fontWeight: 600, marginTop: 14}}>auto-runs on every build<br /><span style={{color: '#E8484F'}}>below 80 fails CI</span></div>
      </div>

      <div style={{width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
        <OffthreadVideo src={staticFile('doctor.mp4')} startFrom={270} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};
