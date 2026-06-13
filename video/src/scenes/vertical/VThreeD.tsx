import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, Series, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../../fonts';
import {bright} from '../../theme';

// ACT IV — THE 3D, BRIDGED (38–45.7s), vertical. The SAME choreography that
// scrolls the page also drives the WebGL camera. Bridge card → footage in a
// centered 16:9 card with type stacked above/below.
export const VThreeD: React.FC = () => (
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
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', opacity: out, textAlign: 'center', padding: '0 70px'}}>
      <div style={{fontFamily: mono, color: bright.cognac, fontSize: 38, fontWeight: 700, letterSpacing: 7, opacity: rise}}>THE SAME <span style={{color: bright.ink}}>{'{ }'}</span> JSON</div>
      <div style={{fontFamily: serif, color: bright.ink, fontSize: 108, fontWeight: 600, lineHeight: 1.05, marginTop: 22, transform: `translateY(${interpolate(rise, [0, 1], [22, 0])}px)`}}>
        also drives the <span style={{fontStyle: 'italic', color: bright.cognac}}>WebGL camera.</span>
      </div>
    </AbsoluteFill>
  );
};

const CARD_W = 1000;
const CARD_H = Math.round((CARD_W * 9) / 16); // 562

const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 168;
  const fade = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap = interpolate(frame, [16, 34, d - 30, d - 14], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
        <OffthreadVideo src={staticFile('footage/flagship-ride.mp4')} startFrom={0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{textAlign: 'center', marginTop: 56, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 40, fontWeight: 700, letterSpacing: 4}}>REAL MESHES · THREE.JS · WEBXR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 80, fontWeight: 700, marginTop: 18}}>Not faked depth.</div>
      </div>
    </AbsoluteFill>
  );
};
