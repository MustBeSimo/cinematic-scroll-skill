import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../../fonts';
import {bright} from '../../theme';

// Reel3 ACT IV — REAL 3D (200f), vertical. No footage reused from the worlds
// act: the authentic NEXUS immersive WebXR lab plays first (real GPU shaders),
// then cross-fades into the flagship camera ride — both in a centered 16:9 card.
// Bridge type above, lower-third below. Mirrors the 16:9 R3ThreeD.
const CARD_W = 1000;
const CARD_H = Math.round((CARD_W * 9) / 16); // 562

export const V3ThreeD: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 200;

  const fade      = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const immOp     = interpolate(frame, [0, 10, 126, 144], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rideOp    = interpolate(frame, [128, 146], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridge    = interpolate(frame, [10, 26], [0, 1],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridgeOut = interpolate(frame, [78, 98], [1, 0],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap       = interpolate(frame, [120, 138, d - 24, d - 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#05060B', opacity: fade, justifyContent: 'center', alignItems: 'center'}}>
      {/* bridge message above the card, fades out */}
      <div style={{textAlign: 'center', marginBottom: 56, opacity: bridge * bridgeOut, padding: '0 60px'}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 38, fontWeight: 700, letterSpacing: 6}}>THE SAME {'{ }'} JSON</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 84, fontWeight: 700, letterSpacing: -1, marginTop: 16, lineHeight: 1.05}}>
          also drives a<br /><span style={{color: '#7FE9DA'}}>real WebGL camera.</span>
        </div>
      </div>

      {/* centered 16:9 card — immersive lab → flagship ride crossfade */}
      <div style={{width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.6)'}}>
        <AbsoluteFill style={{opacity: immOp}}>
          <OffthreadVideo src={staticFile('footage/immersive.mp4')} startFrom={45} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
        <AbsoluteFill style={{opacity: rideOp}}>
          <OffthreadVideo src={staticFile('footage/flagship-ride.mp4')} startFrom={0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      </div>

      {/* lower-third below the card */}
      <div style={{textAlign: 'center', marginTop: 56, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 40, fontWeight: 700, letterSpacing: 4}}>REAL MESHES · THREE.JS · WEBXR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 80, fontWeight: 700, marginTop: 16}}>Not faked depth.</div>
      </div>
    </AbsoluteFill>
  );
};
