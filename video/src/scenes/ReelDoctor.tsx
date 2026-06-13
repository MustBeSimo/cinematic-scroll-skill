import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, Series, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// ACT V — THE DOCTOR, LABELED (45.7–51.7s). The "87" isn't a mystery Lighthouse
// score: it's the skill grading its OWN taste and blocking anything under 80.
// Kept (it's a real, unique feature) but now with the who/what/why on screen.
export const ReelDoctor: React.FC = () => (
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
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, textAlign: 'center'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 7, opacity: rise}}>AND IT GRADES ITSELF</div>
      <div style={{fontFamily: serif, color: bright.ink, fontSize: 84, fontWeight: 600, marginTop: 10, transform: `translateY(${interpolate(rise, [0, 1], [20, 0])}px)`}}>
        Taste, as a <span style={{fontStyle: 'italic', color: bright.cognac}}>number you can gate on.</span>
      </div>
    </AbsoluteFill>
  );
};

const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 136;
  const fade = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap = interpolate(frame, [16, 32, d - 24, d - 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#05080A', opacity: fade}}>
      <OffthreadVideo src={staticFile('doctor.mp4')} startFrom={270} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {/* who / what / why — answers what the bare 87 never did */}
      <div style={{position: 'absolute', left: 80, top: 78, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>CINEMATIC-DOCTOR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 38, fontWeight: 600, marginTop: 6}}>auto-runs on every build · <span style={{color: '#E8484F'}}>below 80 fails CI</span></div>
      </div>
    </AbsoluteFill>
  );
};
