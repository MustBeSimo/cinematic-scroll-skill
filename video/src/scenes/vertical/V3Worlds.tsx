import React from 'react';
import {AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../../fonts';
import {bright} from '../../theme';

// Reel3 ACT III — THE WALL OF WORLDS (880f), vertical. The 9:16 twin of the
// 16:9 wall: one engine doesn't make a handful of sites, it makes any site. Open
// on a single full-width mini-site that pulls back to reveal it's one cell in a
// grid of eight distinct aesthetics — then the grid keeps extending off every
// edge, reading as endless. Resolves on "∞ INFINITE WORLDS".
const WORLDS = [
  {id: 'noir',        index: '01', title: 'VANTASCOPE',      name: 'Editorial sci-fi', accent: '#E23A4E', start: 110},
  {id: 'renaissance', index: '02', title: 'CLASSIC TOUCH',   name: 'Renaissance',      accent: '#B6892F', start: 55},
  {id: 'luxe',        index: '03', title: 'MAISON SOLENNE',  name: 'Quiet luxury',     accent: '#A4652F', start: 40},
  {id: 'pop',         index: '04', title: 'BLOOM',           name: 'Gen-Z pop',        accent: '#FF2E93', start: 70},
  {id: 'studio',      index: '05', title: 'MAYA TORRES',     name: 'Brutalist studio', accent: '#2D6BFF', start: 240},
  {id: 'atelier',     index: '06', title: 'ATELIER NOCTURNE', name: 'Kinetic shader',  accent: '#8E7CFF', start: 345},
  {id: 'wellness',    index: '07', title: 'NATURALLY ROOTED', name: 'Organic wellness', accent: '#6F7A57', start: 200},
  {id: 'retro',       index: '08', title: 'NOVADECK',        name: 'Y2K retro-future', accent: '#00B3E6', start: 200},
];
const HERO = WORLDS[3];   // pop — bold open
const HERO_IDX = 3;

const COLS = 3;
const ROWS = 15;
const GAP = 14;
const GRID_W = 1080;
const CELL_W = (GRID_W - GAP * (COLS + 1)) / COLS;   // 341.33
const CELL_H = (CELL_W * 9) / 16;                    // 192
const GRID_H = ROWS * CELL_H + (ROWS + 1) * GAP;     // 3104
const CR = 7, CC = 1;                                // true centre cell
const CENTER_N = CR * COLS + CC;
const HERO_W = 1024;                                 // singularity width

function worldFor(r: number, c: number) {
  const n = r * COLS + c;
  const idx = (((n * 5) % 8) - ((CENTER_N * 5) % 8) + HERO_IDX + 16) % 8;
  return WORLDS[idx];
}
function isFeatured(r: number) {
  return r >= 6 && r <= 8; // central rows play live video
}

export const V3Worlds: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);

  const scale = interpolate(frame, [0, 400, 700, 880], [1.0, 1.0, 0.5, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const gridOp = clip(frame, 140, 192);
  const driftY = interpolate(frame, [400, 880], [0, -360], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const tilt = interpolate(frame, [400, 760], [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

  const heroScale = interpolate(frame, [0, 96, 188], [1, 1, CELL_W / HERO_W], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const heroOp = interpolate(frame, [0, 150, 190], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const heroRadius = interpolate(heroScale, [CELL_W / HERO_W, 1], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const tail = interpolate(frame, [866, 880], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const eyebrow = clip(frame, 8, 26);
  const heroName = interpolate(frame, [14, 34, 130, 162], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const infiniteIn = interpolate(frame, [470, 510, 812, 850], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subIn = clip(frame, 540, 580);

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      {/* the wall */}
      <AbsoluteFill style={{perspective: 2000, justifyContent: 'center', alignItems: 'center', opacity: gridOp}}>
        <div style={{position: 'relative', width: GRID_W, height: GRID_H, transform: `translateY(${driftY}px) rotateX(${tilt}deg) scale(${scale})`, transformStyle: 'preserve-3d'}}>
          {Array.from({length: ROWS}).map((_, r) =>
            Array.from({length: COLS}).map((_, c) => {
              const w = worldFor(r, c);
              const dist = Math.abs(r - CR) + Math.abs(c - CC);
              const reveal = dist === 0 ? 1 : clip(frame, 96 + dist * 16, 124 + dist * 16);
              return <Cell key={`${r}-${c}`} r={r} c={c} world={w} featured={isFeatured(r)} opacity={reveal} seed={r * COLS + c} />;
            }),
          )}
        </div>
      </AbsoluteFill>

      {/* singularity hero */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: heroOp, pointerEvents: 'none'}}>
        <div style={{width: HERO_W, height: (HERO_W * 9) / 16, transform: `scale(${heroScale})`, overflow: 'hidden', borderRadius: heroRadius, boxShadow: '0 30px 90px rgba(20,12,6,0.4)'}}>
          <OffthreadVideo src={staticFile(`footage/${HERO.id}.mp4`)} startFrom={HERO.start + 22} playbackRate={0.5} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      </AbsoluteFill>

      {/* paper vignette */}
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 200px 60px rgba(243,235,219,0.78)'}} />

      {/* top eyebrow */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', opacity: eyebrow, fontFamily: mono, fontSize: 30, letterSpacing: 7, color: bright.ink, mixBlendMode: 'multiply'}}>
        ONE ENGINE
      </div>

      {/* hero name-flash */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200, opacity: heroName}}>
        <div style={{background: bright.card, borderLeft: `6px solid ${HERO.accent}`, borderRadius: 5, padding: '20px 34px', boxShadow: '0 26px 64px rgba(20,12,6,0.4)'}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
            <span style={{fontFamily: mono, color: HERO.accent, fontSize: 30, fontWeight: 700}}>{HERO.index}</span>
            <span style={{fontFamily: grotesk, color: bright.ink, fontSize: 60, fontWeight: 700, letterSpacing: -1}}>{HERO.title}</span>
          </div>
        </div>
      </AbsoluteFill>

      {/* infinite payoff */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: infiniteIn, padding: '0 40px'}}>
        <div style={{background: 'rgba(243,235,219,0.66)', backdropFilter: 'blur(2px)', borderRadius: 26, padding: '44px 44px'}}>
          <div style={{fontFamily: mono, fontSize: 22, letterSpacing: 3, color: bright.cognac, fontWeight: 700, lineHeight: 1.5}}>ONE ENGINE · ANY AESTHETIC<br />SAME {'{ }'} SOURCE</div>
          <div style={{fontFamily: grotesk, fontSize: 138, fontWeight: 700, letterSpacing: -4, color: bright.ink, lineHeight: 0.98, marginTop: 16}}>
            <span style={{color: bright.cognac}}>∞</span><br />Infinite<br />worlds.
          </div>
          <div style={{opacity: subIn, fontFamily: grotesk, fontStyle: 'italic', fontSize: 40, color: bright.inkSoft, marginTop: 22, fontWeight: 500, lineHeight: 1.25}}>
            …and every brand you<br />haven't built yet.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cell: React.FC<{r: number; c: number; world: typeof WORLDS[number]; featured: boolean; opacity: number; seed: number}> = ({r, c, world, featured, opacity, seed}) => {
  const left = GAP + c * (CELL_W + GAP);
  const top = GAP + r * (CELL_H + GAP);
  const f = useCurrentFrame();
  const pan = interpolate(f, [0, 880], [30, -30], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left, top, width: CELL_W, height: CELL_H, borderRadius: 8, overflow: 'hidden', border: `1px solid ${bright.line}`, background: '#0d0f12', opacity, boxShadow: '0 10px 28px rgba(20,12,6,0.22)'}}>
      {featured ? (
        <OffthreadVideo src={staticFile(`footage/${world.id}.mp4`)} startFrom={world.start + (seed % 3) * 22} playbackRate={0.5} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.18) translateY(${pan}px)`}} />
      ) : (
        <Img src={staticFile(`world-posters/${world.id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.12) translateY(${pan * 0.5}px)`}} />
      )}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 4, background: world.accent}} />
    </div>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
