import React from 'react';
import {AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, random} from 'remotion';
import {bright} from './theme';
import {ReelHook} from './scenes/ReelHook';
import {ReelPrompt} from './scenes/ReelPrompt';
import {ReelWorlds} from './scenes/ReelWorlds';
import {ReelThreeD} from './scenes/ReelThreeD';
import {ReelTwoMedia} from './scenes/ReelTwoMedia';
import {ReelEnd} from './scenes/ReelEnd';

// Reel — the 60s flagship sizzle (1800 frames @ 30fps). Bright editorial
// framing (warm cream, serif + grotesk, cognac) wrapped around real, dynamic
// scroll footage of the live example pages. Proves all four claims in order:
//   Hook (150)      one engine, every aesthetic
//   Prompt (210)    one sentence in, a cinematic site out
//   Worlds (690)    five clashing aesthetics, same engine   ← the core proof
//   3D + Doctor(360) real 3D, then it grades its own work
//   TwoMedia (180)  one file → site + this very film
//   End (210)       install everywhere · MIT
export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper}}>
      {/* warm, light underscore — original synth bed (Cmaj7·Am7·Fmaj7·G6) */}
      <Audio src={staticFile('music.m4a')} volume={0.8} />

      <Series>
        <Series.Sequence durationInFrames={150}><ReelHook /></Series.Sequence>
        <Series.Sequence durationInFrames={210}><ReelPrompt /></Series.Sequence>
        <Series.Sequence durationInFrames={690}><ReelWorlds /></Series.Sequence>
        <Series.Sequence durationInFrames={360}><ReelThreeD /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><ReelTwoMedia /></Series.Sequence>
        <Series.Sequence durationInFrames={210}><ReelEnd /></Series.Sequence>
      </Series>

      {/* warm paper grain — editorial texture, very subtle */}
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
