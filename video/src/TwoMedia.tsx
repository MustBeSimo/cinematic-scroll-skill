import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {theme} from './theme';
import {Grain} from './components/Grain';
import {TwoMediaHook} from './scenes/TwoMediaHook';
import {TwoMediaSplit} from './scenes/TwoMediaSplit';
import {TwoMediaCompiled} from './scenes/TwoMediaCompiled';
import {TwoMediaEnd} from './scenes/TwoMediaEnd';

// "One choreography. Two media." — 900 frames @ 30fps = 30s.
// 140 (hook) + 260 (split page/film) + 260 (compiled dogfood) + 240 (cmds+end).
export const TwoMedia: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      <Series>
        <Series.Sequence durationInFrames={140}>
          <TwoMediaHook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={260}>
          <TwoMediaSplit />
        </Series.Sequence>
        <Series.Sequence durationInFrames={260}>
          <TwoMediaCompiled />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <TwoMediaEnd />
        </Series.Sequence>
      </Series>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
