import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, Series, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// ACT IV — THE 3D, BRIDGED (38–45.7s). The old cut dropped a watch in with no
// setup. Here it's explicitly tied to the thesis: the SAME choreography that
// scrolls the page also drives the WebGL camera. Real meshes, captured live.
export const ReelThreeD: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={52}>
      <Bridge />
    </Series.Sequence>
    <Series.Sequence durationInFrames={168}>
      <Clip />
    </Series.Sequence>
  </Series>
);

const Bridge: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const out = interpolate(frame, [38, 52], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, textAlign: 'center'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 26, letterSpacing: 7, opacity: rise}}>THE SAME <span style={{color: bright.ink}}>{'{ }'}</span> JSON</div>
      <div style={{fontFamily: serif, color: bright.ink, fontSize: 84, fontWeight: 600, lineHeight: 1.05, marginTop: 10, transform: `translateY(${interpolate(rise, [0, 1], [20, 0])}px)`}}>
        also drives the <span style={{fontStyle: 'italic', color: bright.cognac}}>WebGL camera.</span>
      </div>
    </AbsoluteFill>
  );
};

const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 168;
  const fade = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap = interpolate(frame, [16, 34, d - 30, d - 14], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade}}>
      <OffthreadVideo src={staticFile('footage/flagship-ride.mp4')} startFrom={0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 26%)', pointerEvents: 'none'}} />
      <div style={{position: 'absolute', left: 80, bottom: 84, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>REAL MESHES · THREE.JS · WEBXR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 50, fontWeight: 700, marginTop: 8}}>Not faked depth.</div>
      </div>
    </AbsoluteFill>
  );
};
