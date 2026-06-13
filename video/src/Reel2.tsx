import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {R2Intro}  from './scenes/R2Intro';
import {R2Agent}  from './scenes/R2Agent';
import {R2Worlds} from './scenes/R2Worlds';
import {R2ThreeD} from './scenes/R2ThreeD';
import {R2Doctor} from './scenes/R2Doctor';
import {ReelEnd}  from './scenes/ReelEnd';

// Reel2 — same 60-second structure as Reel, but every act has live footage
// running from its first frame. No pure-text bridge slides.
//
//   I  Intro  (200f)  duality panels with two different live clips from frame 0
//   II Agent  (220f)  renaissance.mp4 behind the typed prompt (scrim overlay)
//   III Worlds (880f) 5 worlds — adds NEXUS LAB (flagship.mp4 proxy)
//   IV ThreeD (220f)  flagship-ride.mp4 from frame 0; bridge message overlaid
//   V  Doctor (180f)  doctor.mp4 from frame 0; bridge message overlaid
//   VI End    (100f)  same clean editorial end card (no footage — intentional contrast)
//   Total: 1800f = 60s @ 30fps
export const Reel2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: bright.paper}}>
    <Audio src={staticFile('music.m4a')} volume={0.8} />
    <Series>
      <Series.Sequence durationInFrames={200}><R2Intro /></Series.Sequence>
      <Series.Sequence durationInFrames={220}><R2Agent /></Series.Sequence>
      <Series.Sequence durationInFrames={880}><R2Worlds /></Series.Sequence>
      <Series.Sequence durationInFrames={220}><R2ThreeD /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><R2Doctor /></Series.Sequence>
      <Series.Sequence durationInFrames={100}><ReelEnd /></Series.Sequence>
    </Series>
    <PaperGrain />
  </AbsoluteFill>
);

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`g-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pg2-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pg2-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
