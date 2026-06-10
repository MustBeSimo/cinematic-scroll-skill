import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';
import {TwoMedia} from './TwoMedia';
import {Flagship3D} from './Flagship3D';

// Three 16:9 compositions (render at --scale=2 for 4K):
//   Promo      — ~25.8s product promo (prompt → site → worlds → end card)
//   TwoMedia   — 30s feature film: "One choreography. Two media." Includes the
//                dogfood scene driven by the compiled scroll-choreography.json.
//   Flagship3D — 30s launch film for the 3D/WebXR flagship route: four
//                movements, the generate:flagship pipeline, the dancer.
export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};
