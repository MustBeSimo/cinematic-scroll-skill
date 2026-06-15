import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {ReelHook}   from './scenes/ReelHook';
import {ReelEngine} from './scenes/ReelEngine';
import {R3Worlds}   from './scenes/R3Worlds';
import {R3ThreeD}   from './scenes/R3ThreeD';
import {R2Doctor}   from './scenes/R2Doctor';
import {ReelCTA}    from './scenes/ReelCTA';

// Reel3 — the ultimate cut. Same ~60s strategy + quality as Reel2, rebuilt for:
//   • NO repeated footage — each clip appears exactly once
//   • fluid motion — pure Remotion frames (no capture judder)
//   • comprehensive arc — pain → what-it-is/agentic → range → real 3D → taste gate → CTA
//
//   I   Hook    (180f)  the pain/alpha: "AI builds every website. It designs none." → "Taste is."
//   II  Engine  (180f)  a portable agent skill; prompt → engaged; Claude/Cursor/Hermes/OpenClaw; npx install
//   III Worlds  (880f)  the WALL OF WORLDS — one site pulls back into a grid of
//                       eight aesthetics that extends off-frame → "∞ infinite worlds"
//   IV  3D      (200f)  the NEXUS WebXR lab → flagship camera ride (real WebGL)
//   V   Doctor  (180f)  the taste gate — scores 0–100 before it ships
//   VI  CTA     (180f)  free·MIT·open · install · "Taste is the moat" · links
//   Total: 1800f = 60s @ 30fps
export const Reel3: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: bright.paper}}>
    <Audio src={staticFile('music.m4a')} volume={0.8} />
    <Series>
      <Series.Sequence durationInFrames={180}><ReelHook /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><ReelEngine /></Series.Sequence>
      <Series.Sequence durationInFrames={880}><R3Worlds /></Series.Sequence>
      <Series.Sequence durationInFrames={200}><R3ThreeD /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><R2Doctor /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><ReelCTA /></Series.Sequence>
    </Series>
    <PaperGrain />
  </AbsoluteFill>
);

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`g3-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pg3-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pg3-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
