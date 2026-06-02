import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';
import {MaskWipeTitle} from '../components/MaskWipeTitle';
import {Vignette} from '../components/Grain';
import {Caption} from '../components/Caption';

const DUR = 300;
const D = 900; // base parallax travel

// Scene 3 (135–360): the finished noir scroll page, scrolling. The proof.
export const NoirScrollScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, DUR], [0, 1], {easing: Easing.inOut(Easing.quad)});
  const ty = (speed: number) => -scroll * D * speed;

  // background morph: teal arrival → crimson dread
  const morph = interpolate(scroll, [0, 1], [0, 1]);
  const bg = `radial-gradient(140% 120% at 50% ${18 + morph * 20}%, rgba(${46 + morph * 120},${122 - morph * 70},${118 - morph * 40},0.45) 0%, ${theme.bgDeep} 62%)`;

  const activeChapter = Math.min(3, Math.floor(scroll * 4));
  const camRotY = interpolate(scroll, [0, 1], [-3, 4]);
  const camZ = interpolate(scroll, [0, 1], [0, -70]);

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {/* fog layer — depth 0.15 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${ty(0.15)}px)`,
          background: `radial-gradient(60% 50% at 60% 40%, ${theme.fog} 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />
      {/* crimson edge light — depth 0.5 */}
      <div
        style={{
          position: 'absolute',
          right: 360,
          top: 220,
          width: 360,
          height: 620,
          transform: `translateY(${ty(0.5)}px)`,
          background: `radial-gradient(closest-side, ${theme.crimson}, transparent)`,
          opacity: 0.35,
          filter: 'blur(36px)',
        }}
      />
      {/* subject silhouette — depth 0.75 + 3D camera */}
      <div style={{position: 'absolute', inset: 0, perspective: 1400, transform: `translateY(${ty(0.75)}px)`}}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 300,
            width: 260,
            height: 640,
            marginLeft: -130,
            transform: `rotateY(${camRotY}deg) rotateX(2deg) translateZ(${camZ}px)`,
            background: 'linear-gradient(180deg, #0c1a1c 0%, #060c0e 100%)',
            borderRadius: '120px 120px 24px 24px',
            boxShadow: `inset -10px 0 30px ${theme.crimson}55, inset 8px 0 40px #000, 0 60px 120px #000`,
          }}
        />
      </div>
      {/* roman numeral watermark — depth 1.2 */}
      <div
        style={{
          position: 'absolute',
          right: 90,
          top: 120,
          transform: `translateY(${ty(1.2)}px)`,
          fontFamily: grotesk,
          fontSize: 460,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.04)',
          lineHeight: 1,
        }}
      >
        IV
      </div>
      {/* title block — depth 1.0 (HTML over the scene) */}
      <div style={{position: 'absolute', left: 110, top: 360, transform: `translateY(${ty(1.0)}px)`}}>
        <div style={{fontFamily: mono, color: theme.teal, fontSize: 30, letterSpacing: 10, marginBottom: 18}}>
          VANTASCOPE
        </div>
        <MaskWipeTitle text="Hollow Star" startAt={10} fontFamily={grotesk} color={theme.warm} size={210} />
        <div style={{fontFamily: mono, color: theme.sub, fontSize: 30, letterSpacing: 6, marginTop: 22}}>
          CHAPTER {['I — ARRIVAL', 'II — DESCENT', 'III — STATIC', 'IV — HOLLOW'][activeChapter]}
        </div>
      </div>

      {/* second chapter beat — reveals in the back half */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 640,
          transform: `translateY(${ty(0.45)}px)`,
          opacity: interpolate(frame, [188, 206, 286, 300], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <MaskWipeTitle text="Into the Dark" startAt={188} fontFamily={grotesk} color={theme.teal} size={132} />
      </div>

      {/* progress HUD (top) */}
      <div style={{position: 'absolute', top: 64, left: 110, right: 110, height: 3, background: theme.line}}>
        <div style={{height: '100%', width: `${scroll * 100}%`, background: theme.teal}} />
      </div>
      {/* tracking index rail (left) */}
      <div style={{position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 22}}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: i === activeChapter ? 34 : 16,
              height: 3,
              background: i === activeChapter ? theme.teal : theme.line,
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      <Vignette strength={0.6} />
      <Caption text="pinned chapters · parallax · scroll-driven 3D" dur={DUR} />
    </AbsoluteFill>
  );
};
