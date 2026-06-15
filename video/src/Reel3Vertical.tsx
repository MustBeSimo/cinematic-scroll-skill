import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {V3Hook}   from './scenes/vertical/V3Hook';
import {V3Engine} from './scenes/vertical/V3Engine';
import {V3Worlds} from './scenes/vertical/V3Worlds';
import {V3ThreeD} from './scenes/vertical/V3ThreeD';
import {VDoctor}  from './scenes/vertical/VDoctor';
import {V3CTA}    from './scenes/vertical/V3CTA';

// Reel3Vertical — the 9:16 (1080×1920) cut of Reel3 for Reels / Shorts / TikTok.
// Same six acts, same copy, same per-act durations and the same footage + music
// as the 16:9 Reel3, re-laid-out for big mobile-legible type: each world's
// landscape footage in a centered 16:9 card, act TYPE stacked above, label below.
//   I   Hook   (180)  the pain/alpha: "AI builds every website…" → "Taste is."
//   II  Engine (180)  a portable agent skill; prompt → engaged; chips; npx install
//   III Worlds (880)  five distinct aesthetics scrolling: noir·renaissance·luxe·pop·studio
//   IV  3D     (200)  the NEXUS WebXR lab → flagship camera ride (real WebGL)
//   V   Doctor (180)  the taste gate — scores 0–100, blocks < 80 (reused vertical scene)
//   VI  CTA    (180)  free·MIT·open · install · "Taste is the moat" · links
//   Total: 1800f = 60s @ 30fps
export const Reel3Vertical: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: bright.paper}}>
    <Audio src={staticFile('music.m4a')} volume={0.8} />
    <Series>
      <Series.Sequence durationInFrames={180}><V3Hook /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><V3Engine /></Series.Sequence>
      <Series.Sequence durationInFrames={880}><V3Worlds /></Series.Sequence>
      <Series.Sequence durationInFrames={200}><V3ThreeD /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><VDoctor /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><V3CTA /></Series.Sequence>
    </Series>
    <PaperGrain />
  </AbsoluteFill>
);

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`g3v-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pg3v-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pg3v-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
