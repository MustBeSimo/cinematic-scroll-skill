import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';
import {TwoMedia} from './TwoMedia';
import {Flagship3D} from './Flagship3D';
import {Doctor} from './Doctor';
import {Reel} from './Reel';
import {ReelVertical} from './ReelVertical';
import {Reel2} from './Reel2';

// Six 16:9 compositions (render at --scale=2 for 4K):
//   Reel       — 60s flagship sizzle (original cut)
//   Reel2      — 60s re-edit: every act has live footage from frame 0,
//                no text-only bridge slides; 5 worlds including NEXUS LAB
//   ReelVertical — 9:16 vertical version of Reel (original)
//   Promo      — ~25.8s product promo
//   TwoMedia   — 30s "One choreography. Two media." feature film
//   Flagship3D — 30s launch film for the 3D/WebXR flagship
//   Doctor     — 24s cinematic-doctor launch film
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Reel2"
        component={Reel2}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ReelVertical"
        component={ReelVertical}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={775}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TwoMedia"
        component={TwoMedia}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Flagship3D"
        component={Flagship3D}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Doctor"
        component={Doctor}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
