import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {VDuality} from './scenes/vertical/VDuality';
import {VAgent} from './scenes/vertical/VAgent';
import {VWorlds} from './scenes/vertical/VWorlds';
import {VThreeD} from './scenes/vertical/VThreeD';
import {VDoctor} from './scenes/vertical/VDoctor';
import {VEnd} from './scenes/vertical/VEnd';

// ReelVertical — the 9:16 (1080×1920) cut of the flagship sizzle for Reels /
// Shorts / TikTok. Same six acts, same copy, same per-act durations and the same
// footage + music as the 16:9 Reel — re-laid-out for big mobile-legible type
// with each world's landscape footage shown in a centered 16:9 card, the act
// TYPE stacked above and the label/caption below.
//   I  Duality (200)  one JSON → website + this very film (stacked vertically)
//   II Agent (220)    it's a SKILL — describe the brand, get the site
//   III Worlds (720)  4 aesthetics, viewport SCROLLS through them
//   IV 3D (220)       the same JSON drives the WebGL camera (bridged)
//   V  Doctor (180)   the skill grades its own taste, blocks < 80 (labeled)
//   VI End (260)      one CTA: ★ Star on GitHub
export const ReelVertical: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper}}>
      {/* warm, light underscore — same original synth bed as the 16:9 Reel */}
      <Audio src={staticFile('music.m4a')} volume={0.8} />

      <Series>
        <Series.Sequence durationInFrames={200}><VDuality /></Series.Sequence>
        <Series.Sequence durationInFrames={220}><VAgent /></Series.Sequence>
        <Series.Sequence durationInFrames={720}><VWorlds /></Series.Sequence>
        <Series.Sequence durationInFrames={220}><VThreeD /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><VDoctor /></Series.Sequence>
        <Series.Sequence durationInFrames={260}><VEnd /></Series.Sequence>
      </Series>

      <PaperGrain />
    </AbsoluteFill>
  );
};

const PaperGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`g-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.035, mixBlendMode: 'multiply'}}>
      <svg width="100%" height="100%">
        <filter id={`pgv-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pgv-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
