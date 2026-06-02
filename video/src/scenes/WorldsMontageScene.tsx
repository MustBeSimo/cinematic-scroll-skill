import React from 'react';
import {AbsoluteFill, Series, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, serif, mono} from '../fonts';
import {theme} from '../theme';
import {worlds} from '../theme';
import {Caption} from '../components/Caption';

const PER = 23;

const WorldCard: React.FC<{w: (typeof worlds)[number]}> = ({w}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, PER], [1.06, 1.0], {easing: Easing.out(Easing.cubic)});
  const o = interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: w.bg, opacity: o, justifyContent: 'center', alignItems: 'flex-start'}}>
      <div style={{transform: `scale(${scale})`, transformOrigin: 'left center', paddingLeft: 120}}>
        <div style={{fontFamily: mono, color: w.accent, fontSize: 28, letterSpacing: 6, marginBottom: 16}}>
          {w.label.toUpperCase()}
        </div>
        <div
          style={{
            fontFamily: w.serif ? serif : grotesk,
            color: w.ink,
            fontSize: 168,
            fontWeight: 700,
            lineHeight: 0.94,
            letterSpacing: w.serif ? 0 : -3,
            textTransform: 'uppercase',
          }}
        >
          {w.title}
        </div>
        <div style={{width: 90, height: 4, background: w.accent, marginTop: 26}} />
      </div>
    </AbsoluteFill>
  );
};

// Scene 4 (360–432): same engine, five clashing looks, fast cuts.
export const WorldsMontageScene: React.FC = () => {
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      <Series>
        {worlds.map((w) => (
          <Series.Sequence key={w.id} durationInFrames={PER}>
            <WorldCard w={w} />
          </Series.Sequence>
        ))}
      </Series>
      <Caption text="same engine. any look." dur={115} />
    </AbsoluteFill>
  );
};
