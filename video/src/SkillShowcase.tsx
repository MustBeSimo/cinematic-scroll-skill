import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig, Easing, Audio, random} from 'remotion';
import {grotesk, mono, serif} from './fonts';
import {PRESENTER} from './scenes/showcase/presenter';

/* ────────────────────────────────────────────────────────────────────────────
   SkillShowcase — a presenter promo for the cinematic-scroll skill, built with the
   Montage technique: live 3-D pages as full-frame backgrounds, glassmorphic animated
   cards, a bottom-left presenter PiP, and a music bed. Backgrounds are the real,
   headless-captured scroll-throughs of the homepage + the Verdant & AUREUS fly-throughs.
   ──────────────────────────────────────────────────────────────────────────── */

// brass / dark cinematic palette (the live 3-D footage carries the colour)
const C = {
  bg: '#0c0a08',
  fg: '#f6efe4',
  fgSoft: 'rgba(246,239,228,0.72)',
  brass: '#e6b765',
  slate: '#9fb6c9',
  glassBg: 'rgba(18,14,9,0.40)',
  glassBorder: 'rgba(246,239,228,0.20)',
};

const ease = Easing.inOut(Easing.cubic);
const INTRO = 84, SCENE = 176, OUTRO = 116, OVER = 16;
const sceneStart = (i: number) => INTRO - OVER + i * (SCENE - OVER);
const OUTRO_START = sceneStart(2) + SCENE - OVER;
export const SKILL_DUR = OUTRO_START + OUTRO; // ≈ 664f ≈ 22.1s
// start offset (frames @30fps) into the eleven-worlds clip used as the intro backdrop
const INTRO_BG_START = 510;        // 16:9 clip
const INTRO_BG_START_V = 525;      // 9:16 clip (vertical) — refined by frame-scan

type Scene = {src: string; eyebrow: string; title: string; titleEm?: string; body: string; chips: string[]; accent: string; side: 'left' | 'right'};
const SCENES: Scene[] = [
  {src: 'homepage', eyebrow: 'What it does', title: 'Describe an', titleEm: 'aesthetic.', body: 'Your agent builds it — real WebGL, twelve scroll patterns, art-directed to match. The motion is the constant; the look is yours.', chips: ['doctor-gated 94–100', '0 build step', 'any agent'], accent: C.brass, side: 'right'},
  {src: 'jungle', eyebrow: 'Built by the skill · 01', title: 'Verdant —', titleEm: 'into the bloom.', body: 'Sterile concrete reclaimed by nature: a real rainforest sky lights the colonnade, pollen drifts through god-rays — rendered live, every frame.', chips: ['three.js', 'image-based light', 'scroll-camera'], accent: '#8fc25a', side: 'right'},
  {src: 'aureus', eyebrow: 'Built by the skill · 02', title: 'Into the', titleEm: 'Vault.', body: 'A flight down a liquid-chrome corridor that reflects a real studio — raymarched metaballs, sparks drifting, paced exactly to your scroll.', chips: ['raymarch', 'real reflections', 'scroll-scrubbed'], accent: '#5ce0ff', side: 'right'},
];

const env = (frame: number, start: number, dur: number, fade = OVER) =>
  interpolate(frame, [start, start + fade, start + dur - fade, start + dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const SkillShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* music bed (the repo's track) — fades in/out */}
      <Audio src={staticFile('music.m4a')} volume={(f) => interpolate(f, [0, 24, SKILL_DUR - 48, SKILL_DUR], [0, 0.2, 0.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {/* narration from the avatar clip (only when present) */}
      {PRESENTER.PRESENT ? <Audio src={staticFile(PRESENTER.SRC)} startFrom={0} /> : null}

      <Intro frame={frame} />

      {SCENES.map((s, i) => {
        const start = sceneStart(i);
        const op = env(frame, start, SCENE);
        if (op <= 0) return null;
        return <SceneLayer key={s.src} scene={s} start={start} local={frame - start} opacity={op} />;
      })}

      {/* presenter PiP rides the three content scenes */}
      <PresenterPiP frame={frame} from={sceneStart(0)} to={OUTRO_START + 8} />

      <Outro frame={frame} start={OUTRO_START} />
      <Grain />
    </AbsoluteFill>
  );
};

/* ── a content scene: full-bleed 3-D footage + a glassmorphic card ── */
const SceneLayer: React.FC<{scene: Scene; start: number; local: number; opacity: number}> = ({scene, start, local, opacity}) => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const z = interpolate(local, [0, SCENE], [1.04, 1.10], {extrapolateRight: 'clamp', easing: ease}); // slow push-in
  const dx = interpolate(local, [0, SCENE], [scene.side === 'right' ? 1.2 : -1.2, 0], {extrapolateRight: 'clamp', easing: ease});
  const scrim = portrait
    ? 'linear-gradient(to bottom, rgba(8,6,4,0.86) 0%, rgba(8,6,4,0.30) 32%, rgba(8,6,4,0) 56%)'
    : scene.side === 'right' ? 'linear-gradient(to left, rgba(8,6,4,0.74) 0%, rgba(8,6,4,0) 46%)' : 'linear-gradient(to right, rgba(8,6,4,0.74) 0%, rgba(8,6,4,0) 46%)';
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        {/* anchor playback to the scene start so each (short) clip plays live, not frozen on its last frame */}
        <Sequence from={start} layout="none">
          <OffthreadVideo src={staticFile(`footage/hq/${scene.src}.mp4`)} startFrom={6} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) translateX(${dx}%)`}} />
        </Sequence>
      </AbsoluteFill>
      {/* readability scrim — side gradient in landscape, top gradient in portrait (card rides the top) */}
      <AbsoluteFill style={{background: scrim, pointerEvents: 'none'}} />
      <GlassCard scene={scene} local={local} portrait={portrait} />
    </AbsoluteFill>
  );
};

const Spring = (frame: number, fps: number, cfg: {damping: number; stiffness: number}) => spring({frame, fps, config: {...cfg, mass: 0.9}});

/* ── glassmorphic animated card (Montage Caption technique, brass-tinted) ── */
const GlassCard: React.FC<{scene: Scene; local: number; portrait: boolean}> = ({scene, local, portrait}) => {
  const {fps} = useVideoConfig();
  const inSp = Spring(Math.max(0, local - 10), fps, {damping: 16, stiffness: 110});
  const out = interpolate(local, [SCENE - 22, SCENE - 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const a = inSp * out;
  const x = (1 - inSp) * (scene.side === 'right' ? 60 : -60);
  const wrap: any = portrait
    ? {position: 'absolute', top: 150, left: 40, right: 40, transform: `translateY(${(1 - inSp) * -40}px)`, opacity: a}
    : {position: 'absolute', top: '50%', [scene.side]: 'clamp(40px,6vw,110px)', transform: `translateY(-50%) translateX(${x}px)`, opacity: a, maxWidth: 560};
  return (
    <div style={wrap}>
      <div style={{padding: '34px 40px', borderRadius: 26, background: C.glassBg, border: `1px solid ${C.glassBorder}`, backdropFilter: 'blur(18px) saturate(1.1)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 40px 100px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: mono, fontSize: 17, letterSpacing: 4, textTransform: 'uppercase', color: scene.accent}}>
          <span style={{width: 30, height: 2, background: scene.accent, display: 'inline-block'}} />{scene.eyebrow}
        </div>
        <div style={{fontFamily: serif, fontWeight: 500, fontSize: 64, lineHeight: 1.0, letterSpacing: -1, color: C.fg, marginTop: 16}}>
          {scene.title} <span style={{fontStyle: 'italic', color: scene.accent}}>{scene.titleEm}</span>
        </div>
        <div style={{fontFamily: grotesk, fontSize: 25, lineHeight: 1.5, color: C.fgSoft, marginTop: 18}}>{scene.body}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22}}>
          {scene.chips.map((c) => (
            <span key={c} style={{fontFamily: mono, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: C.fgSoft, padding: '7px 14px', border: `1px solid ${C.glassBorder}`, borderRadius: 999}}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── presenter PiP: avatar clip if present, else branded placeholder ── */
const PresenterPiP: React.FC<{frame: number; from: number; to: number}> = ({frame, from, to}) => {
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;
  if (frame < from - 4 || frame > to + 20) return null;
  const inSp = Spring(Math.max(0, frame - from), fps, {damping: 16, stiffness: 90});
  const out = interpolate(frame, [to, to + 18], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const x = -380 + inSp * 380;
  const box: any = portrait
    ? {position: 'absolute', left: 48, bottom: 96, width: 360, height: 480, borderRadius: 30, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.82)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', transform: `translateX(${x}px)`, opacity: out}
    : {position: 'absolute', left: 64, bottom: 70, width: 300, height: 380, borderRadius: 28, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.82)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', transform: `translateX(${x}px)`, opacity: out};
  return (
    <div style={box}>
      {PRESENTER.PRESENT ? (
        <OffthreadVideo src={staticFile(PRESENTER.SRC)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : (
        <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', background: `radial-gradient(120% 90% at 50% 28%, ${C.brass} 0%, #5a3d12 55%, ${C.bg} 100%)`}}>
          <div style={{position: 'absolute', top: 96, fontFamily: serif, fontSize: 96, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: -2}}>SL</div>
          <div style={{width: '100%', padding: '18px 16px', textAlign: 'center', background: 'linear-gradient(to top, rgba(8,6,4,0.85), transparent)'}}>
            <div style={{fontFamily: mono, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: C.brass}}>Presented by</div>
            <div style={{fontFamily: grotesk, fontSize: 22, fontWeight: 600, color: '#fff', marginTop: 4}}>Simone Leonelli</div>
            <div style={{fontFamily: mono, fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.6)', marginTop: 2}}>W230</div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── intro brand frame ── */
const Intro: React.FC<{frame: number}> = ({frame}) => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const op = interpolate(frame, [0, 12, INTRO - 14, INTRO], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const words = ['CINEMATIC', 'SCROLL'];
  const z = interpolate(frame, [0, INTRO], [1.06, 1.14], {extrapolateRight: 'clamp', easing: ease}); // slow push-in over the footage
  const bgSrc = portrait ? 'showcase/eleven-worlds-9x16.mp4' : 'showcase/eleven-worlds-16x9.mp4';
  const bgStart = portrait ? INTRO_BG_START_V : INTRO_BG_START;
  const titleSize = portrait ? 116 : 152;
  return (
    <AbsoluteFill style={{opacity: op, backgroundColor: C.bg}}>
      {/* live footage backdrop (the eleven-worlds fly-through) instead of a flat gradient */}
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(bgSrc)} startFrom={bgStart} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}} />
      </AbsoluteFill>
      {/* brand scrim keeps the title legible over the motion */}
      <AbsoluteFill style={{background: 'radial-gradient(120% 100% at 50% 30%, rgba(26,20,13,0.42) 0%, rgba(12,10,8,0.84) 72%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: portrait ? '0 40px' : undefined}}>
        <div style={{maxWidth: portrait ? 920 : undefined}}>
        <div style={{fontFamily: mono, fontSize: 24, letterSpacing: 8, color: C.brass, fontWeight: 700, opacity: interpolate(frame, [4, 20], [0, 1], {extrapolateRight: 'clamp'})}}>A FREE AGENT SKILL</div>
        <div style={{display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: portrait ? 0 : 28, justifyContent: 'center', marginTop: 16}}>
          {words.map((w, i) => {
            const wy = interpolate(frame, [10 + i * 6, 34 + i * 6], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
            const wo = interpolate(frame, [10 + i * 6, 30 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return <div key={w} style={{overflow: 'hidden'}}><div style={{fontFamily: grotesk, fontSize: titleSize, fontWeight: 700, letterSpacing: -5, lineHeight: portrait ? 0.96 : 1, color: i === 1 ? C.brass : C.fg, transform: `translateY(${wy}px)`, opacity: wo}}>{w}</div></div>;
          })}
        </div>
        <div style={{fontFamily: serif, fontStyle: 'italic', fontSize: portrait ? 30 : 40, color: C.fgSoft, marginTop: 22, opacity: interpolate(frame, [30, 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>One sentence in. A cinematic, scroll-driven website out.</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── outro CTA ── */
const Outro: React.FC<{frame: number; start: number}> = ({frame, start}) => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const op = interpolate(frame, [start, start + 16, start + OUTRO - 12, start + OUTRO], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const l = frame - start;
  const cmd = interpolate(l, [22, 42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ty = interpolate(l, [0, 24], [40, 0], {extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: op, background: 'radial-gradient(120% 100% at 50% 30%, #1a140d 0%, #0c0a08 72%)', padding: portrait ? '0 40px' : undefined}}>
      <div style={{transform: `translateY(${ty}px)`, maxWidth: portrait ? 940 : undefined}}>
        <div style={{fontFamily: mono, fontSize: portrait ? 19 : 22, letterSpacing: 6, color: C.brass, fontWeight: 700}}>ONE CONTRACT · INFINITE WORLDS</div>
        <div style={{fontFamily: grotesk, fontSize: portrait ? 92 : 128, fontWeight: 700, letterSpacing: -4, color: C.fg, lineHeight: 1, marginTop: 14}}>Build <span style={{color: C.brass}}>yours.</span></div>
        <div style={{opacity: cmd, marginTop: portrait ? 32 : 40}}>
          <span style={{fontFamily: mono, fontSize: portrait ? 24 : 30, background: 'rgba(246,239,228,0.06)', color: C.fg, border: `1px solid ${C.glassBorder}`, borderRadius: 12, padding: '16px 26px'}}><span style={{color: C.brass}}>$ </span>npx cinematic-scroll-skill</span>
        </div>
        <div style={{opacity: cmd, fontFamily: serif, fontStyle: 'italic', fontSize: portrait ? 22 : 32, color: C.fgSoft, marginTop: 22}}>github.com/MustBeSimo/cinematic-scroll-skill · by Simone Leonelli</div>
      </div>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`ss-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.045, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id={`ssg-${frame}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter={`url(#ssg-${frame})`} /></svg>
    </AbsoluteFill>
  );
};
