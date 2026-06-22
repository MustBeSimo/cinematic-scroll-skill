import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing, Audio, random} from 'remotion';
import {grotesk, mono, serif} from './fonts';
import {bright} from './theme';

// Showcase — a cinematic SHOWREEL of the sites the skill builds. Each shot plays a
// real captured scroll-through full-frame with a slow camera push-in, letterbox bars,
// and kinetic brand text; shots crossfade. Intro + outro are the electric-blue brand
// frame. The footage is the proof — these are real builds, scrolling.
type Shot = {src: string; brand: string; system: string; tag: string; accent: string; start: number};
// all themed sites — vanilla, so captured with buttery rAF scroll at 2× sharpness (footage/hq/)
const SHOTS: Shot[] = [
  {src: 'clinical-noir',       brand: 'VANTA LABS',        system: 'CLINICAL NOIR',       tag: 'Clarity, in the dark.',       accent: '#D8B57A', start: 8},
  {src: 'brutalist-kinetic',   brand: 'CONCRETE / ORANGE', system: 'BRUTALIST KINETIC',   tag: 'Built, not decorated.',       accent: '#FF6A2C', start: 8},
  {src: 'liquid-chrome',       brand: 'CHROMA',            system: 'LIQUID CHROME',       tag: 'Premium, in motion.',         accent: '#7DF9FF', start: 8},
  {src: 'botanical-editorial', brand: 'VERDANT PRESS',     system: 'BOTANICAL EDITORIAL', tag: 'Printed, pressed, patient.',  accent: '#79B85E', start: 8},
  {src: 'data-cinematic',      brand: 'SIGNAL',            system: 'DATA CINEMATIC',      tag: 'Data with gravity.',          accent: '#4FE0B0', start: 8},
  {src: 'temporal-monument',   brand: 'OBSIDIAN',          system: 'TEMPORAL MONUMENT',   tag: 'Time, made monumental.',      accent: '#E8C97A', start: 8},
  {src: 'warm-scrapbook',      brand: 'KEEPSAKE',          system: 'WARM SCRAPBOOK',      tag: 'Summers you can hold.',       accent: '#F0A48E', start: 8},
  {src: 'atmospheric-sublime', brand: 'FARSIGHT',          system: 'ATMOSPHERIC SUBLIME', tag: 'Distance is the point.',      accent: '#C8A57E', start: 8},
  {src: 'symmetric-monument',  brand: 'MERIDIAN',          system: 'SYMMETRIC MONUMENT',  tag: 'The art of standing still.',  accent: '#E0556A', start: 8},
];

const FPS = 30;
const INTRO = 78, OUTRO = 96, SHOT = 112, OVER = 16;
const STRIDE = SHOT - OVER;
const shotStart = (i: number) => INTRO - OVER + i * STRIDE;
export const SHOWCASE_DUR = shotStart(SHOTS.length - 1) + SHOT + OUTRO - OVER;

const ease = Easing.inOut(Easing.cubic);
const env = (frame: number, start: number, dur: number, fade = OVER) =>
  interpolate(frame, [start, start + fade, start + dur - fade, start + dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  const outroStart = shotStart(SHOTS.length - 1) + SHOT - OVER;
  const barsIn = interpolate(frame, [INTRO - 24, INTRO + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const barsOut = interpolate(frame, [outroStart - 6, outroStart + 18], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bars = barsIn * barsOut;

  return (
    <AbsoluteFill style={{backgroundColor: '#05060A'}}>
      <Audio src={staticFile('music.m4a')} volume={(f) => interpolate(f, [0, 24, SHOWCASE_DUR - 50, SHOWCASE_DUR], [0, 0.8, 0.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />

      <Intro frame={frame} />

      {SHOTS.map((s, i) => {
        const start = shotStart(i);
        const op = env(frame, start, SHOT);
        if (op <= 0) return null;
        return <ShotLayer key={s.src} shot={s} index={i} total={SHOTS.length} local={frame - start} opacity={op} />;
      })}

      {/* cinematic letterbox */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 132, background: '#000', transform: `translateY(${(1 - bars) * -132}px)`}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 132, background: '#000', transform: `translateY(${(1 - bars) * 132}px)`}} />

      <Outro frame={frame} start={outroStart} />
      <Grain />
    </AbsoluteFill>
  );
};

const ShotLayer: React.FC<{shot: Shot; index: number; total: number; local: number; opacity: number}> = ({shot, index, total, local, opacity}) => {
  // GENTLE camera life on top of the page's own (now-fluid) scroll. Kept tiny so the
  // crisp HQ footage is never meaningfully upscaled (that was the old "soft/too-big" look).
  const z = interpolate(local, [0, SHOT], [1.0, 1.045], {extrapolateRight: 'clamp', easing: ease});
  const dx = interpolate(local, [0, SHOT], [-0.5, 0.5], {extrapolateRight: 'clamp'});
  // kinetic text envelope (in early, out before the crossfade)
  const tIn = interpolate(local, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const tOut = interpolate(local, [SHOT - 26, SHOT - 12], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const t = tIn * tOut;
  const brandY = interpolate(local, [10, 34], [108, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const barW = interpolate(local, [24, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const tagY = interpolate(local, [32, 54], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo
          src={staticFile(`footage/hq/${shot.src}.mp4`)}
          startFrom={shot.start}
          playbackRate={1}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateX(${dx}%)`}}
        />
      </AbsoluteFill>

      {/* readability scrim bottom-left */}
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.0) 34%)', pointerEvents: 'none', opacity: t}} />

      {/* index counter — top-right inside the frame */}
      <div style={{position: 'absolute', top: 162, right: 70, textAlign: 'right', opacity: t, fontFamily: mono, color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,0.55)'}}>
        <span style={{fontSize: 30, fontWeight: 700}}>{String(index + 1).padStart(2, '0')}</span>
        <span style={{fontSize: 22, opacity: 0.6}}> / {String(total).padStart(2, '0')}</span>
      </div>

      {/* kinetic brand block — lower left */}
      <div style={{position: 'absolute', left: 80, bottom: 186, opacity: t}}>
        <div style={{fontFamily: mono, fontSize: 24, letterSpacing: 6, color: '#fff', opacity: 0.78}}>{shot.system}</div>
        <div style={{overflow: 'hidden', marginTop: 8}}>
          <div style={{fontFamily: grotesk, fontSize: 96, fontWeight: 700, letterSpacing: -2, color: '#fff', lineHeight: 1.04, transform: `translateY(${brandY}px)`}}>{shot.brand}</div>
        </div>
        <div style={{height: 5, width: 220, background: shot.accent, marginTop: 14, transform: `scaleX(${barW})`, transformOrigin: 'left'}} />
        <div style={{fontFamily: serif, fontStyle: 'italic', fontSize: 40, color: '#fff', opacity: 0.92, marginTop: 18, transform: `translateY(${tagY}px)`}}>{shot.tag}</div>
      </div>
    </AbsoluteFill>
  );
};

const Intro: React.FC<{frame: number}> = ({frame}) => {
  const op = interpolate(frame, [0, 14, INTRO - 14, INTRO], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const y = interpolate(frame, [0, 24], [30, 0], {extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: op}}>
      <div style={{transform: `translateY(${y}px)`}}>
        <div style={{fontFamily: mono, fontSize: 26, letterSpacing: 8, color: bright.cognac, fontWeight: 700}}>WHAT THE SKILL BUILDS</div>
        <div style={{fontFamily: grotesk, fontSize: 132, fontWeight: 700, letterSpacing: -4, color: bright.ink, lineHeight: 1, marginTop: 14}}>Real sites. <span style={{color: bright.cognac}}>Real scroll.</span></div>
        <div style={{fontFamily: serif, fontStyle: 'italic', fontSize: 42, color: bright.inkSoft, marginTop: 18}}>Every clip below is a live build — scrolling.</div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{frame: number; start: number}> = ({frame, start}) => {
  const op = interpolate(frame, [start, start + 16, start + OUTRO - 12, start + OUTRO], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const l = frame - start;
  const cmd = interpolate(l, [22, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: op}}>
      <div style={{fontFamily: mono, fontSize: 25, letterSpacing: 6, color: bright.cognac, fontWeight: 700}}>ELEVEN SYSTEMS · INFINITE WORLDS</div>
      <div style={{fontFamily: grotesk, fontSize: 118, fontWeight: 700, letterSpacing: -3, color: bright.ink, lineHeight: 1, marginTop: 12}}>Build any of them.</div>
      <div style={{opacity: cmd, display: 'flex', gap: 16, marginTop: 40}}>
        <span style={{fontFamily: mono, fontSize: 28, background: '#F1EEE4', color: '#1E26EB', borderRadius: 10, padding: '14px 22px'}}><span style={{color: '#8A90D8'}}>$ </span>npx cinematic-scroll-skill</span>
      </div>
      <div style={{opacity: cmd, fontFamily: serif, fontStyle: 'italic', fontSize: 34, color: bright.cognac, marginTop: 24}}>clawhub.ai/mustbesimo/cinematic-scroll</div>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`sc-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.05, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id={`scg-${frame}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter={`url(#scg-${frame})`} /></svg>
    </AbsoluteFill>
  );
};
