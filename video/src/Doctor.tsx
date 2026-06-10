import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {theme} from './theme';
import {Grain} from './components/Grain';
import {DocHook, DocScan, DocScore, DocGate, DocEnd} from './scenes/DoctorScenes';

// DOCTOR — 720 frames @ 30fps = 24s. The launch film for cinematic-doctor:
// the doctor reads the build, the score lands, the gate blocks slop. Pure
// motion graphics (no captures), so it renders deterministically anywhere.
// 100 + 150 + 200 + 130 + 140 = 720.
export const Doctor: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bgDeep}}>
      <Series>
        <Series.Sequence durationInFrames={100}>
          <DocHook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <DocScan />
        </Series.Sequence>
        <Series.Sequence durationInFrames={200}>
          <DocScore />
        </Series.Sequence>
        <Series.Sequence durationInFrames={130}>
          <DocGate />
        </Series.Sequence>
        <Series.Sequence durationInFrames={140}>
          <DocEnd />
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
