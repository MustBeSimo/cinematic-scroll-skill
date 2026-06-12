import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {theme} from './theme';
import {Grain} from './components/Grain';
import {F3DHook, F3DRide, F3DGenerate, F3DDancer, F3DEnd} from './scenes/Flagship3DScenes';

// FLAGSHIP-3D — 900 frames @ 30fps = 30s. The launch film for the /flagship
// route, built on REAL captures of the live page (public/flagship/): the hero
// frame, a 9s scroll-through recorded with a deterministic virtual-time
// camera, the fal.ai concept→mesh pair, and the spotlit dancer.
// 120 + 270 + 180 + 150 + 180 = 900.
export const Flagship3D: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      <Series>
        <Series.Sequence durationInFrames={120}>
          <F3DHook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <F3DRide />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <F3DGenerate />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <F3DDancer />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <F3DEnd />
        </Series.Sequence>
      </Series>

      {/* global cinematic overlays — same finish as the other films */}
      <Grain opacity={0.07} />
      <Letterbox />
    </AbsoluteFill>
  );
};

const Letterbox: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 44, background: '#000'}} />
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: '#000'}} />
  </AbsoluteFill>
);
