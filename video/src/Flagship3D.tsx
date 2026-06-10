import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {theme} from './theme';
import {Grain} from './components/Grain';
import {F3DHook, F3DPipeline, F3DMovements, F3DDancer, F3DEnd} from './scenes/Flagship3DScenes';

// FLAGSHIP-3D — 900 frames @ 30fps = 30s. The launch film for the /flagship
// route: four movements, the one-command generate pipeline, the out-of-the-box
// dancer. Pure motion graphics (no captures), so it renders deterministically
// anywhere. 110 + 160 + 360 + 120 + 150 = 900.
export const Flagship3D: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      <Series>
        <Series.Sequence durationInFrames={110}>
          <F3DHook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={160}>
          <F3DPipeline />
        </Series.Sequence>
        <Series.Sequence durationInFrames={360}>
          <F3DMovements />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <F3DDancer />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
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
