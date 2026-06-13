import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, Series, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// 35–47s. The technical peak. A bright editorial lead-in card frames the drop
// into the real, darker 3D footage as a deliberate "wow" reveal, then back to
// the bright scorecard idea. Real captures, self-narrating, no text overlay:
//   flagship-ride : live WebGL — real Draco chronometer + colonnade + GLSL field
//   doctor   9–14s: the "87" scorecard with per-category bars (the CI gate)
export const ReelThreeD: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={45}>
      <LeadCard />
    </Series.Sequence>
    <Series.Sequence durationInFrames={165}>
      <Clip src="footage/flagship-ride.mp4" startFrom={0} durationInFrames={165} />
    </Series.Sequence>
    <Series.Sequence durationInFrames={150}>
      <Clip src="doctor.mp4" startFrom={270} durationInFrames={150} />
    </Series.Sequence>
  </Series>
);

const LeadCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const out = interpolate(frame, [32, 45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, textAlign: 'center'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 22, letterSpacing: 8, opacity: rise}}>NOT FAKED DEPTH</div>
      <div style={{fontFamily: serif, color: bright.ink, fontSize: 110, fontStyle: 'italic', fontWeight: 600, lineHeight: 1, marginTop: 6, transform: `translateY(${interpolate(rise, [0, 1], [20, 0])}px)`}}>
        Real 3D.
      </div>
    </AbsoluteFill>
  );
};

const Clip: React.FC<{src: string; startFrom: number; durationInFrames: number}> = ({src, startFrom, durationInFrames}) => {
  const frame = useCurrentFrame();
  const d = durationInFrames;
  const fade = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade}}>
      <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};
