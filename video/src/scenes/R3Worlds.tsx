import React from 'react';
import {AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// Reel3 Act III — THE WALL OF WORLDS (880f). The range, reframed as INFINITE.
// One engine doesn't make five sites — it makes any site. So the act opens on a
// single live mini-site that fills the screen, then the camera pulls back: the
// hero is one cell in a grid of eight distinct aesthetics, and the grid keeps
// extending off every edge with a gentle perspective tilt and an endless upward
// drift. Front tiles play live footage; the deep tiles are poster stills so the
// wall reads as vast without a runaway render. Resolves on "∞ INFINITE WORLDS".
// `start` = a hand-picked image-rich frame in each clip, so tiles never land on
// a clip's blank/white editorial section.
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
const HERO = WORLDS[3]; // pop — the singularity tile opens bold, never blank

const COLS = 3;
const ROWS = 9;                       // tall enough to spill off-frame when zoomed out
const GAP = 16;
const GRID_W = 1920;
const CELL_W = (GRID_W - GAP * (COLS + 1)) / COLS;   // 618.67
const CELL_H = (CELL_W * 9) / 16;                    // 348
const GRID_H = ROWS * CELL_H + (ROWS + 1) * GAP;     // 3292
const CR = 4, CC = 1;                                // center cell (row 4, col 1) — true grid centre

// world for a given cell, with the centre cell forced to the hero (index 0)
const CENTER_N = CR * COLS + CC;
const HERO_IDX = 3; // pop — must land on the centre cell
function worldFor(r: number, c: number) {
  const n = r * COLS + c;
  const idx = (((n * 5) % 8) - ((CENTER_N * 5) % 8) + HERO_IDX + 16) % 8;
  return WORLDS[idx];
}
function isFeatured(r: number) {
  return r >= 3 && r <= 5; // central three rows play live video
}

export const R3Worlds: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);

  // The grid never scales above 1.0 (a huge 3D-transformed layer fails to
  // rasterize). It holds at 1.0 (a 3×3 of worlds) then recedes to imply infinity.
  const scale = interpolate(frame, [0, 400, 700, 880], [1.0, 1.0, 0.55, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const gridOp = clip(frame, 140, 192);
  // endless upward drift once we're zoomed out
  const driftY = interpolate(frame, [400, 880], [0, -300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  // subtle perspective tilt as the wall recedes
  const tilt = interpolate(frame, [400, 760], [0, 9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

  // singularity: a single full-screen mini-site that shrinks to exactly the
  // centre-cell size as the grid fades in around it — a seamless pull-back.
  const heroScale = interpolate(frame, [0, 96, 188], [1, 1, CELL_W / GRID_W], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const heroOp = interpolate(frame, [0, 150, 190], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const heroRadius = interpolate(heroScale, [CELL_W / GRID_W, 1], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const tail = interpolate(frame, [866, 880], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // overlays
  const eyebrow = clip(frame, 8, 26);
  const heroName = interpolate(frame, [14, 34, 130, 162], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const infiniteIn = interpolate(frame, [470, 510, 812, 850], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subIn = clip(frame, 540, 580);

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      {/* the wall — a single grid, centred on screen, scaled around its centre */}
      <AbsoluteFill style={{perspective: 2400, justifyContent: 'center', alignItems: 'center', opacity: gridOp}}>
        <div style={{
          position: 'relative', width: GRID_W, height: GRID_H,
          transform: `translateY(${driftY}px) rotateX(${tilt}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
        }}>
          {Array.from({length: ROWS}).map((_, r) =>
            Array.from({length: COLS}).map((_, c) => {
              const w = worldFor(r, c);
              const dist = Math.abs(r - CR) + Math.abs(c - CC);
              const reveal = dist === 0 ? 1 : clip(frame, 96 + dist * 20, 124 + dist * 20);
              return (
                <Cell key={`${r}-${c}`} r={r} c={c} world={w} featured={isFeatured(r)} opacity={reveal} seed={r * COLS + c} />
              );
            }),
          )}
        </div>
      </AbsoluteFill>

      {/* singularity hero — one full-screen site that pulls back onto the centre cell */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: heroOp, pointerEvents: 'none'}}>
        <div style={{width: GRID_W, height: (GRID_W * 9) / 16, transform: `scale(${heroScale})`, overflow: 'hidden', borderRadius: heroRadius, boxShadow: '0 30px 90px rgba(20,12,6,0.4)'}}>
          <OffthreadVideo src={staticFile(`footage/${HERO.id}.mp4`)} startFrom={HERO.start + 22} playbackRate={0.5} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
      </AbsoluteFill>

      {/* paper vignette so the wall edges melt into the page */}
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 220px 70px rgba(243,235,219,0.78)'}} />

      {/* top eyebrow */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 64, textAlign: 'center', opacity: eyebrow, fontFamily: mono, fontSize: 24, letterSpacing: 7, color: bright.ink, mixBlendMode: 'multiply'}}>
        ONE ENGINE
      </div>

      {/* hero name-flash during the singularity */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120, opacity: heroName}}>
        <div style={{background: bright.card, borderLeft: `6px solid ${HERO.accent}`, borderRadius: 5, padding: '20px 34px', boxShadow: '0 26px 64px rgba(20,12,6,0.4)'}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
            <span style={{fontFamily: mono, color: HERO.accent, fontSize: 26, fontWeight: 700}}>{HERO.index}</span>
            <span style={{fontFamily: grotesk, color: bright.ink, fontSize: 54, fontWeight: 700, letterSpacing: -1}}>{HERO.title}</span>
          </div>
        </div>
      </AbsoluteFill>

      {/* the infinite payoff */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: infiniteIn}}>
        <div style={{background: 'rgba(243,235,219,0.62)', backdropFilter: 'blur(2px)', borderRadius: 24, padding: '40px 70px'}}>
          <div style={{fontFamily: mono, fontSize: 26, letterSpacing: 6, color: bright.cognac, fontWeight: 700}}>ONE ENGINE · ANY AESTHETIC · SAME {'{ }'} SOURCE</div>
          <div style={{fontFamily: grotesk, fontSize: 176, fontWeight: 700, letterSpacing: -5, color: bright.ink, lineHeight: 1, marginTop: 10}}>
            <span style={{color: bright.cognac}}>∞</span> Infinite worlds.
          </div>
          <div style={{opacity: subIn, fontFamily: grotesk, fontStyle: 'italic', fontSize: 44, color: bright.inkSoft, marginTop: 18, fontWeight: 500}}>
            …and every brand you haven't built yet.
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
  // slow pan inside live tiles so they never read as frozen
  const pan = interpolate(f, [0, 880], [40, -40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left, top, width: CELL_W, height: CELL_H, borderRadius: 10, overflow: 'hidden', border: `1px solid ${bright.line}`, background: '#0d0f12', opacity, boxShadow: '0 14px 36px rgba(20,12,6,0.22)'}}>
      {featured ? (
        <OffthreadVideo
          src={staticFile(`footage/${world.id}.mp4`)}
          startFrom={world.start + (seed % 3) * 22}
          playbackRate={0.5}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.18) translateY(${pan}px)`}}
        />
      ) : (
        <Img
          src={staticFile(`world-posters/${world.id}.jpg`)}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.12) translateY(${pan * 0.5}px)`}}
        />
      )}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 5, background: world.accent}} />
    </div>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
