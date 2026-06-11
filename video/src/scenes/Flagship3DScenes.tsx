import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing, random} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';

// ────────────────────────────────────────────────────────────────────────────
// FLAGSHIP-3D scenes — built on REAL captures of the /flagship route
// (public/flagship/*.jpg + scroll.mp4, recorded from the live page with a
// deterministic virtual-time camera). The film shows the product, not a
// storyboard of it.
// ────────────────────────────────────────────────────────────────────────────

const CYAN = '#3de0ff';
const EMBER = '#ffb270';
const ease = Easing.out(Easing.cubic);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Full-bleed capture with a slow Ken Burns push — the film's base layer. */
const Plate: React.FC<{src: string; from?: number; to?: number; dur: number}> = ({src, from = 1.0, to = 1.06, dur}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, dur], [from, to], {...clamp, easing: Easing.inOut(Easing.quad)});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`}} />
    </AbsoluteFill>
  );
};

/** Bottom gradient so type sits on the imagery like the route's own overlay. */
const Scrim: React.FC<{strength?: number}> = ({strength = 0.78}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(4,7,10,0.25) 0%, rgba(4,7,10,0) 30%, rgba(4,7,10,0) 55%, rgba(4,7,10,${strength}) 100%)`,
    }}
  />
);

// ─── Scene 1 · Hook (120f) — the real hero frame ───────────────────────────
export const F3DHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      <Plate src="flagship/object.jpg" dur={120} />
      <Scrim />
      <div style={{position: 'absolute', left: 84, bottom: 96}}>
        <div
          style={{
            fontFamily: mono,
            color: CYAN,
            fontSize: 24,
            letterSpacing: 8,
            marginBottom: 26,
            opacity: interpolate(frame, [6, 20], [0, 1], clamp),
          }}
        >
          REACT THREE FIBER · WEBXR · ONE ROUTE
        </div>
        {['Four movements.', 'One scroll.'].map((line, i) => (
          <div key={line} style={{overflow: 'hidden'}}>
            <div
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 110,
                lineHeight: 1.04,
                color: i === 1 ? CYAN : theme.warm,
                transform: `translateY(${interpolate(frame, [14 + i * 9, 34 + i * 9], [110, 0], {...clamp, easing: ease})}px)`,
              }}
            >
              {line}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2 · The Ride (270f) — the real scroll-through, 1:1 frames ───────
// No added labels: the route's own overlay (eyebrow, titles, ledes) narrates
// each movement in-frame — the film just lets the product speak.
export const F3DRide: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      {/* The capture is 30fps/270f — this Sequence is too: every film frame IS
          a product frame. */}
      <OffthreadVideo src={staticFile('flagship/scroll.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div
        style={{
          position: 'absolute',
          right: 84,
          bottom: 84,
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: 4,
          color: theme.sub,
          opacity: interpolate(frame, [30, 44, 250, 264], [0, 0.9, 0.9, 0], clamp),
        }}
      >
        captured from the live route — not a mockup
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3 · Generate (180f) — concept → mesh, the real pipeline ─────────
export const F3DGenerate: React.FC = () => {
  const frame = useCurrentFrame();
  const meshIn = interpolate(frame, [70, 92], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{background: `radial-gradient(110% 90% at 50% 15%, #0a1a1c 0%, ${theme.bgDeep} 65%)`, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', gap: 56, alignItems: 'center'}}>
        {/* the real fal.ai concept image */}
        <div style={{width: 660, opacity: interpolate(frame, [8, 24], [0, 1], clamp)}}>
          <div style={{border: `1px solid ${theme.line}`, overflow: 'hidden', height: 540}}>
            <Img src={staticFile('flagship/concept.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div style={{fontFamily: mono, fontSize: 22, letterSpacing: 3, color: theme.sub, marginTop: 18}}>
            01 · concept — fal-ai/nano-banana-2
          </div>
        </div>
        {/* the arrow that does the work */}
        <div style={{textAlign: 'center', opacity: interpolate(frame, [40, 56], [0, 1], clamp)}}>
          <div style={{fontFamily: grotesk, fontSize: 64, color: CYAN}}>→</div>
          <div style={{fontFamily: mono, fontSize: 19, color: theme.sub, letterSpacing: 2, marginTop: 8}}>
            image→3D
            <br />
            draco + webp
          </div>
        </div>
        {/* the same artifact, live on the route */}
        <div style={{width: 660, opacity: meshIn, transform: `translateX(${(1 - meshIn) * 36}px)`}}>
          <div style={{border: `1px solid rgba(61,224,255,0.4)`, overflow: 'hidden', height: 540}}>
            <Img src={staticFile('flagship/object.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div style={{fontFamily: mono, fontSize: 22, letterSpacing: 3, color: CYAN, marginTop: 18}}>
            02 · in the scene — auto-normalized, ~1 MB
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 28,
          color: theme.warm,
          letterSpacing: 2,
          marginTop: 54,
          opacity: interpolate(frame, [104, 120], [0, 1], clamp),
        }}
      >
        $ npm run generate:flagship -- --apply
      </div>
      <Caption text="One command. Real 3D assets." dur={180} />
    </AbsoluteFill>
  );
};

// ─── Scene 4 · Dancer (150f) — the real spotlight frame ────────────────────
export const F3DDancer: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      <Plate src="flagship/figure.jpg" from={1.05} to={1.0} dur={150} />
      <Scrim strength={0.66} />
      <div style={{position: 'absolute', left: 84, bottom: 96}}>
        {['It dances', 'out of the box.'].map((line, i) => (
          <div key={line} style={{overflow: 'hidden'}}>
            <div
              style={{
                fontFamily: grotesk,
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 1.06,
                color: i === 1 ? EMBER : theme.warm,
                transform: `translateY(${interpolate(frame, [10 + i * 9, 30 + i * 9], [100, 0], {...clamp, easing: ease})}px)`,
              }}
            >
              {line}
            </div>
          </div>
        ))}
        <div
          style={{
            fontFamily: mono,
            fontSize: 23,
            letterSpacing: 3,
            color: theme.sub,
            marginTop: 24,
            opacity: interpolate(frame, [44, 60], [0, 1], clamp),
          }}
        >
          dancer.glb · rigged + animated · 0.8 MB · root motion stripped
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5 · End card (180f) ──────────────────────────────────────────────
export const F3DEnd: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(110% 90% at 50% 15%, #0a1a1c 0%, ${theme.bgDeep} 65%)`, justifyContent: 'center', alignItems: 'center'}}>
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {Array.from({length: 50}, (_, i) => {
          const x = random(`fx${i}`) * 1920;
          const y = random(`fy${i}`) * 1080;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.04 + i * 1.7));
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, width: 2.5, height: 2.5, borderRadius: '50%', background: CYAN, opacity: tw * 0.4}} />
          );
        })}
      </AbsoluteFill>
      <div style={{textAlign: 'center'}}>
        <div style={{overflow: 'hidden'}}>
          <div
            style={{
              fontFamily: grotesk,
              fontWeight: 700,
              fontSize: 104,
              color: theme.warm,
              transform: `translateY(${interpolate(frame, [6, 28], [110, 0], {...clamp, easing: ease})}px)`,
            }}
          >
            The motion is the constant.
          </div>
        </div>
        <div style={{overflow: 'hidden'}}>
          <div
            style={{
              fontFamily: grotesk,
              fontWeight: 700,
              fontSize: 104,
              color: CYAN,
              transform: `translateY(${interpolate(frame, [16, 38], [110, 0], {...clamp, easing: ease})}px)`,
            }}
          >
            The look is yours.
          </div>
        </div>
        <div
          style={{
            fontFamily: mono,
            color: theme.sub,
            fontSize: 28,
            letterSpacing: 2,
            marginTop: 48,
            opacity: interpolate(frame, [48, 64], [0, 1], clamp),
          }}
        >
          github.com/MustBeSimo/cinematic-scroll-skill
        </div>
        <div
          style={{
            fontFamily: mono,
            color: theme.sub,
            fontSize: 23,
            letterSpacing: 4,
            marginTop: 20,
            opacity: interpolate(frame, [60, 76], [0, 1], clamp),
          }}
        >
          MIT · FREE · WEBXR · /flagship
        </div>
      </div>
    </AbsoluteFill>
  );
};
