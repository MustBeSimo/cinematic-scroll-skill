import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';

// ~25.8s @ 30fps. One 16:9 composition (render at --scale=2 for 4K).
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={775}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
