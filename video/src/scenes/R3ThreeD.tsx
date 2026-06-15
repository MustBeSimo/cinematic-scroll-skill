import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../fonts';

// Reel3 Act IV — REAL 3D (200 frames). The depth dimension, with no footage
// reused from the worlds act: the authentic NEXUS immersive WebXR lab plays
// first (real GPU shaders), then cross-fades into the flagship camera ride.
// Message: the same scroll-choreography also drives a real WebGL camera.
export const R3ThreeD: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 200;

  const fade      = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const immOp     = interpolate(frame, [0, 10, 126, 144], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rideOp    = interpolate(frame, [128, 146], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridge    = interpolate(frame, [10, 26], [0, 1],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridgeOut = interpolate(frame, [70, 90], [1, 0],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap       = interpolate(frame, [120, 138, d - 24, d - 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade}}>
      {/* immersive WebXR lab — plays first */}
      <AbsoluteFill style={{opacity: immOp}}>
        <OffthreadVideo src={staticFile('footage/immersive.mp4')} startFrom={45} muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {/* flagship camera ride — cross-fades in */}
      <AbsoluteFill style={{opacity: rideOp}}>
        <OffthreadVideo src={staticFile('footage/flagship-ride.mp4')} startFrom={0} muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>

      {/* gradient scrims */}
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 42%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 26%)', pointerEvents: 'none'}} />

      {/* bridge message early, fades out */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: bridge * bridgeOut}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 28, letterSpacing: 7}}>THE SAME {'{ }'} JSON</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 78, fontWeight: 700, letterSpacing: -1, marginTop: 8}}>
          also drives a <span style={{color: '#7FE9DA'}}>real WebGL camera.</span>
        </div>
      </AbsoluteFill>

      {/* lower-third */}
      <div style={{position: 'absolute', left: 80, bottom: 84, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>REAL MESHES · THREE.JS · WEBXR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 50, fontWeight: 700, marginTop: 8}}>Not faked depth.</div>
      </div>
    </AbsoluteFill>
  );
};
