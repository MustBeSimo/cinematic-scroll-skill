import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {theme} from './theme';
import {Grain} from './components/Grain';
import {PromptScene} from './scenes/PromptScene';
import {BuildFlashScene} from './scenes/BuildFlashScene';
import {PipelineScene} from './scenes/PipelineScene';
import {NoirScrollScene} from './scenes/NoirScrollScene';
import {WorldsMontageScene} from './scenes/WorldsMontageScene';
import {EndCardScene} from './scenes/EndCardScene';

// 775 frames @ 30fps ≈ 25.8s.  110 + 70 + 95 + 300 + 115 + 85 = 775.
export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      <Series>
        <Series.Sequence durationInFrames={110}>
          <PromptScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={70}>
          <BuildFlashScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={95}>
          <PipelineScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <NoirScrollScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={115}>
          <WorldsMontageScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={85}>
          <EndCardScene />
        </Series.Sequence>
      </Series>

      {/* global cinematic overlays */}
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
