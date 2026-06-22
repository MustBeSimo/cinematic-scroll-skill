import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, interpolate, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {V3Hook}        from './scenes/vertical/V3Hook';
import {V3Engine}      from './scenes/vertical/V3Engine';
import {VElevenWorlds} from './scenes/vertical/VElevenWorlds';
import {VDoctor}       from './scenes/vertical/VDoctor';
import {V3CTA}         from './scenes/vertical/V3CTA';

// ReelV24Vertical — 9:16 (1080×1920) cut of the v2.4.0 design-system reel for Reels/Shorts.
// Reuses the proven vertical scenes; swaps the wall for the eleven themed brand sites.
//   Hook(180) · Engine(180) · ElevenWorlds(480) · Doctor(180) · CTA(180) = 1200f = 40s
export const ReelV24Vertical: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: bright.paper}}>
    <Audio src={staticFile('music.m4a')} volume={(f) => interpolate(f, [0, 24, 1150, 1200], [0, 0.8, 0.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
    <Series>
      <Series.Sequence durationInFrames={180}><V3Hook /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><V3Engine /></Series.Sequence>
      <Series.Sequence durationInFrames={480}><VElevenWorlds /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><VDoctor /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><V3CTA /></Series.Sequence>
    </Series>
    <PaperGrain />
  </AbsoluteFill>
);

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`v24v-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pgv24v-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pgv24v-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
