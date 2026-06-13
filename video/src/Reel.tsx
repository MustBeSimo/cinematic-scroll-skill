import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {ReelDuality} from './scenes/ReelDuality';
import {ReelAgent} from './scenes/ReelAgent';
import {ReelWorlds} from './scenes/ReelWorlds';
import {ReelThreeD} from './scenes/ReelThreeD';
import {ReelDoctor} from './scenes/ReelDoctor';
import {ReelEnd} from './scenes/ReelEnd';

// Reel — the 60s flagship sizzle (1800 frames @ 30fps), re-edited so the
// killer thesis leads and every act connects to it:
//   I  Duality (200)  one JSON → website + this very film          ← the hook
//   II Agent (220)    it's a SKILL — describe the brand, get the site
//   III Worlds (720)  4 aesthetics, viewport SCROLLS through them  ← the proof
//   IV 3D (220)       the same JSON drives the WebGL camera (bridged)
//   V  Doctor (180)   the skill grades its own taste, blocks < 80 (labeled)
//   VI End (260)      one CTA: ★ Star on GitHub
export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper}}>
      {/* warm, light underscore — original synth bed (Cmaj7·Am7·Fmaj7·G6) */}
      <Audio src={staticFile('music.m4a')} volume={0.8} />

      <Series>
        <Series.Sequence durationInFrames={200}><ReelDuality /></Series.Sequence>
        <Series.Sequence durationInFrames={220}><ReelAgent /></Series.Sequence>
        <Series.Sequence durationInFrames={720}><ReelWorlds /></Series.Sequence>
        <Series.Sequence durationInFrames={220}><ReelThreeD /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><ReelDoctor /></Series.Sequence>
        <Series.Sequence durationInFrames={260}><ReelEnd /></Series.Sequence>
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
        <filter id={`pg-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#pg-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};
