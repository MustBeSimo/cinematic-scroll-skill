import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// R2 Act IV — 3D (220 frames). No text-only bridge: the flagship-ride clip
// plays from frame 0. The "same JSON drives WebGL" message overlays it as a
// lower-third that fades in at frame 10, then the main headline at frame 50.
export const R2ThreeD: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 220;

  const fade    = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridge  = interpolate(frame, [8, 24], [0, 1],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridgeOut = interpolate(frame, [60, 80], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap     = interpolate(frame, [50, 68, d - 30, d - 14], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade}}>
      {/* clip plays from frame 0 */}
      <OffthreadVideo
        src={staticFile('footage/flagship-ride.mp4')}
        startFrom={0}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />

      {/* gradient scrim */}
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 40%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%)', pointerEvents: 'none'}} />

      {/* bridge message — overlays the clip early, fades out */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: bridge * bridgeOut}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 28, letterSpacing: 7}}>THE SAME {'{ }'} JSON</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 78, fontWeight: 700, letterSpacing: -1, marginTop: 8}}>
          also drives the <span style={{color: '#7FE9DA'}}>WebGL camera.</span>
        </div>
      </AbsoluteFill>

      {/* lower-third label */}
      <div style={{position: 'absolute', left: 80, bottom: 84, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>REAL MESHES · THREE.JS · WEBXR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 50, fontWeight: 700, marginTop: 8}}>Not faked depth.</div>
      </div>
    </AbsoluteFill>
  );
};
