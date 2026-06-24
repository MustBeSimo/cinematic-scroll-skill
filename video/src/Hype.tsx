import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing, Audio, random} from 'remotion';
import {grotesk, mono} from './fonts';

// Hype — a FAST, type-driven cut (à la modern marketing reels): huge centered kinetic type,
// punchy ALL-CAPS claims, a rapid world-flash burst, proof stats, checklist, CTA. Black +
// white + one cyan accent. Hard cuts on a quick rhythm. ~26s.
const FPS = 30;
const CY = '#7CE7FF';            // single accent
const INK = '#F4F4F2';
// the 3D-ready WebGL sites lead — they're the most impactful. (path/start/tag override defaults.)
const BURST = [
  {src: 'flagship-ride',       brand: 'FLAGSHIP',          path: 'footage/flagship-ride.mp4', start: 24,  tag: 'REAL 3D · WEBXR'},
  {src: 'clinical-noir',       brand: 'VANTA LABS'},
  {src: 'brutalist-kinetic',   brand: 'CONCRETE / ORANGE'},
  {src: 'immersive',           brand: 'NEXUS LAB',         path: 'footage/immersive.mp4',     start: 80,  tag: 'WEBGL SHADERS'},
  {src: 'data-cinematic',      brand: 'SIGNAL'},
  {src: 'liquid-chrome',       brand: 'CHROMA'},
  {src: 'warm-scrapbook',      brand: 'KEEPSAKE'},
  {src: 'temporal-monument',   brand: 'OBSIDIAN'},
  {src: 'botanical-editorial', brand: 'VERDANT PRESS'},
  {src: 'symmetric-monument',  brand: 'MERIDIAN'},
];
const BURST_START = 196, BURST_SHOT = 30;          // 1s per world, hard cuts
const BURST_END = BURST_START + BURST.length * BURST_SHOT;
export const HYPE_DUR = BURST_END + 330;           // + payoff/proof/checklist/cta

// snappy opacity gate
const gate = (f: number, a: number, b: number, fade = 4) =>
  interpolate(f, [a, a + fade, b - fade, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const Hype: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = (start: number) => spring({frame: frame - start, fps, config: {damping: 16, mass: 0.6, stiffness: 180}});

  return (
    <AbsoluteFill style={{backgroundColor: '#050505'}}>
      <Audio src={staticFile('music.m4a')} volume={(f) => interpolate(f, [0, 18, HYPE_DUR - 40, HYPE_DUR], [0, 0.85, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />

      {/* 0 — brand mark */}
      <Center op={gate(frame, 2, 24)}><Mono size={28} dim>✦ CINEMATIC SCROLL</Mono></Center>

      {/* 1 — hook */}
      <Center op={gate(frame, 26, 70)}><Big s={pop(26)}>AI builds every website.</Big></Center>
      <Center op={gate(frame, 72, 122)}><Big s={pop(72)}>It designs <span style={{color: CY}}>none.</span></Big></Center>
      <Center op={gate(frame, 126, 158)}><Mono size={40} dim>SO TASTE BECAME A SYSTEM</Mono></Center>

      {/* 2 — punch claims */}
      <Center op={gate(frame, 162, 192)}><Huge s={pop(162)}>ONE PROMPT.</Huge></Center>

      {/* 3 — WORLD BURST (fast hard cuts) */}
      {BURST.map((w, i) => {
        const a = BURST_START + i * BURST_SHOT;
        if (frame < a || frame >= a + BURST_SHOT) return null;
        const local = frame - a;
        const z = interpolate(local, [0, BURST_SHOT], [1.06, 1.0], {easing: Easing.out(Easing.quad)});
        return (
          <AbsoluteFill key={w.src}>
            <AbsoluteFill style={{overflow: 'hidden'}}>
              {/* anchor playback to this burst's start so the 1s flash plays live, not frozen */}
              <Sequence from={a} layout="none">
                <OffthreadVideo src={staticFile((w as {path?: string}).path || `footage/hq/burst-${w.src}.mp4`)} startFrom={(w as {start?: number}).start ?? 0} playbackRate={1} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}} />
              </Sequence>
            </AbsoluteFill>
            <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 30%)'}} />
            <div style={{position: 'absolute', left: 64, bottom: 60, display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{fontFamily: mono, color: CY, fontSize: 30, fontWeight: 700}}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{fontFamily: grotesk, color: '#fff', fontSize: 60, fontWeight: 700, letterSpacing: -1}}>{w.brand}</span>
            </div>
            <div style={{position: 'absolute', top: 56, right: 64, fontFamily: mono, color: CY, fontSize: 22, letterSpacing: 4, opacity: 0.95, fontWeight: 700}}>{(w as {tag?: string}).tag || 'LIVE BUILD'}</div>
          </AbsoluteFill>
        );
      })}

      {/* 4 — payoff */}
      <Center op={gate(frame, BURST_END + 2, BURST_END + 44)}>
        <Huge s={pop(BURST_END + 2)}><span style={{color: CY}}>∞</span> infinite worlds.</Huge>
        <Mono size={28} dim>NOT A MENU · ANY AESTHETIC YOU DESCRIBE</Mono>
      </Center>

      {/* 5 — proof */}
      <Center op={gate(frame, BURST_END + 50, BURST_END + 120)}>
        <Mono size={30} dim>AND IT GRADES ITSELF</Mono>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6}}>
          <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 200, color: '#fff', lineHeight: 1}}>{Math.round(interpolate(frame, [BURST_END + 56, BURST_END + 96], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}</span>
          <span style={{fontFamily: grotesk, fontWeight: 700, fontSize: 70, color: CY}}>/100</span>
        </div>
        <Mono size={30}><span style={{color: CY}}>BELOW 80 → CI FAILS</span></Mono>
      </Center>

      {/* 6 — checklist */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: gate(frame, BURST_END + 126, BURST_END + 196)}}>
        {['ONE TOKEN CONTRACT', 'INFINITE LIVE STYLES', 'NINE COMPONENTS', 'CI-GATED TASTE'].map((c, i) => (
          <div key={c} style={{opacity: gate(frame, BURST_END + 130 + i * 8, BURST_END + 200), display: 'flex', alignItems: 'center', gap: 20, margin: '8px 0'}}>
            <span style={{color: CY, fontFamily: grotesk, fontSize: 44, fontWeight: 700}}>✓</span>
            <span style={{fontFamily: grotesk, color: INK, fontSize: 56, fontWeight: 700, letterSpacing: -1}}>{c}</span>
          </div>
        ))}
      </AbsoluteFill>

      {/* 7 — CTA */}
      <Center op={gate(frame, BURST_END + 204, HYPE_DUR)}>
        <Mono size={26} dim>FREE · MIT · SHIPS WITH YOUR AGENT</Mono>
        <div style={{transform: `scale(${pop(BURST_END + 206)})`, fontFamily: mono, fontWeight: 700, fontSize: 64, color: '#fff', margin: '18px 0', background: '#101010', border: `1px solid #2a2a2a`, borderRadius: 12, padding: '20px 34px'}}>
          <span style={{color: CY}}>$ </span>npx cinematic-scroll-skill
        </div>
        <Mono size={34}><span style={{color: CY}}>clawhub.ai/mustbesimo/cinematic-scroll</span></Mono>
        <Mono size={22} dim>BY SIMONE LEONELLI · simoneleonelli.com</Mono>
      </Center>

      <Grain />
    </AbsoluteFill>
  );
};

const Center: React.FC<{op: number; children: React.ReactNode}> = ({op, children}) =>
  op <= 0 ? null : <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: op, padding: '0 8vw'}}><div>{children}</div></AbsoluteFill>;
const Big: React.FC<{s: number; children: React.ReactNode}> = ({s, children}) =>
  <div style={{fontFamily: grotesk, fontWeight: 700, fontSize: 110, letterSpacing: -3, color: INK, lineHeight: 1.02, transform: `scale(${interpolate(s, [0, 1], [0.92, 1])})`}}>{children}</div>;
const Huge: React.FC<{s: number; children: React.ReactNode}> = ({s, children}) =>
  <div style={{fontFamily: grotesk, fontWeight: 700, fontSize: 168, letterSpacing: -5, color: INK, lineHeight: 1, transform: `scale(${interpolate(s, [0, 1], [0.86, 1])})`}}>{children}</div>;
const Mono: React.FC<{size: number; dim?: boolean; children: React.ReactNode}> = ({size, dim, children}) =>
  <div style={{fontFamily: mono, fontSize: size, letterSpacing: 5, color: dim ? '#8a8a8a' : '#fff', fontWeight: 700, marginTop: 14}}>{children}</div>;

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`hy-${frame}`) * 100);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%"><filter id={`hyg-${frame}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter={`url(#hyg-${frame})`} /></svg>
    </AbsoluteFill>
  );
};
