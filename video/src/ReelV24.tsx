import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, interpolate} from 'remotion';
import {bright} from './theme';
import {ReelHook}      from './scenes/ReelHook';
import {ReelEngine}    from './scenes/ReelEngine';
import {ElevenWorlds}  from './scenes/ElevenWorlds';
import {R2Doctor}      from './scenes/R2Doctor';
import {ReelCTA}       from './scenes/ReelCTA';
import {useCurrentFrame, random} from 'remotion';

// ReelV24 — the v2.4.0 design-system cut. Reuses Reel3's proven, music-scored scenes
// and swaps the wall for ELEVEN WORLDS: the 11 themes as 11 real, image-rich brand sites
// (fal.ai heroes, token-driven), pulling back into one deliberate system.
//   I   Hook    (180f)  the pain/alpha: "AI builds every website. It designs none." → taste
//   II  Engine  (180f)  a portable agent skill; prompt → engaged; npx install
//   III Eleven  (480f)  THE WALL OF ELEVEN SYSTEMS — one token contract, eleven brand worlds
//   IV  Doctor  (180f)  the taste gate — scored 0–100 before it ships
//   V   CTA     (180f)  free·MIT·open · install · clawhub link
//   Total: 1200f = 40s @ 30fps
export const ReelV24: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: bright.paper}}>
    <Audio src={staticFile('music.m4a')} volume={(f) => interpolate(f, [0, 24, 1150, 1200], [0, 0.8, 0.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
    <Series>
      <Series.Sequence durationInFrames={180}><ReelHook /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><ReelEngine /></Series.Sequence>
      <Series.Sequence durationInFrames={480}><ElevenWorlds /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><R2Doctor /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><ReelCTA /></Series.Sequence>
    </Series>
    <PaperGrain />
  </AbsoluteFill>
);

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`v24-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.03, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pgv24-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pgv24-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
