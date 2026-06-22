import React from 'react';
import {AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// v2.4.0 Act — THE WALL OF ELEVEN SYSTEMS.
// One design-token contract → eleven machine themes. Opens on a forming grid of
// themed tiles (each the SAME component under a different theme — the literal
// proof), live footage scrolling in the central tiles, then pulls back with a
// perspective tilt + endless drift so the eleven palettes read as a vast,
// deliberate system. Resolves on "ELEVEN SYSTEMS · ONE CONTRACT".
const SYSTEMS = [
  {id: 'symmetric-monument',  index: '01', title: 'SYMMETRIC MONUMENT',  accent: '#C41E3A'},
  {id: 'clinical-noir',       index: '02', title: 'CLINICAL NOIR',       accent: '#C9A96E'},
  {id: 'storybook-geometry',  index: '03', title: 'STORYBOOK GEOMETRY',  accent: '#D4738C'},
  {id: 'temporal-monument',   index: '04', title: 'TEMPORAL MONUMENT',   accent: '#E8C97A'},
  {id: 'atmospheric-sublime', index: '05', title: 'ATMOSPHERIC SUBLIME', accent: '#B8956A'},
  {id: 'warm-scrapbook',      index: '06', title: 'WARM SCRAPBOOK',      accent: '#E8927C'},
  {id: 'naturalistic-drift',  index: '07', title: 'NATURALISTIC DRIFT',  accent: '#5E7050'},
  {id: 'brutalist-kinetic',   index: '08', title: 'BRUTALIST KINETIC',   accent: '#FF4D00'},
  {id: 'liquid-chrome',       index: '09', title: 'LIQUID CHROME',       accent: '#7DF9FF'},
  {id: 'botanical-editorial', index: '10', title: 'BOTANICAL EDITORIAL', accent: '#4A6B3A'},
  {id: 'data-cinematic',      index: '11', title: 'DATA CINEMATIC',      accent: '#4FE0B0'},
];

const COLS = 3, ROWS = 9, GAP = 16, GRID_W = 1920;
const CELL_W = (GRID_W - GAP * (COLS + 1)) / COLS;
const CELL_H = (CELL_W * 9) / 16;
const GRID_H = ROWS * CELL_H + (ROWS + 1) * GAP;
const CR = 4, CC = 1;                                       // centre cell

// cycle the 11 systems across the grid, centre cell forced to the hero (idx 7)
const CENTER_N = CR * COLS + CC;
function systemFor(r: number, c: number) {
  const n = r * COLS + c;
  return SYSTEMS[((n - CENTER_N) * 4 + 7 + 110) % 11];
}
const isFeatured = (r: number) => r >= 3 && r <= 5;          // central rows play live footage

const DUR = 480;                                            // 16s

export const ElevenWorlds: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);

  // hold a readable 3×3 then recede to imply the full system
  const scale = interpolate(frame, [0, 180, 360, DUR], [1.0, 1.0, 0.56, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const driftY = interpolate(frame, [180, DUR], [0, -260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const tilt = interpolate(frame, [180, 420], [0, 9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const gridOp = clip(frame, 6, 40);
  const tail = interpolate(frame, [DUR - 16, DUR], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // overlays
  const eyebrow = interpolate(frame, [10, 30, 150, 178], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const payoffIn = interpolate(frame, [250, 290, 430, 466], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subIn = clip(frame, 312, 348);

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      <AbsoluteFill style={{perspective: 2400, justifyContent: 'center', alignItems: 'center', opacity: gridOp}}>
        <div style={{position: 'relative', width: GRID_W, height: GRID_H, transform: `translateY(${driftY}px) rotateX(${tilt}deg) scale(${scale})`, transformStyle: 'preserve-3d'}}>
          {Array.from({length: ROWS}).map((_, r) =>
            Array.from({length: COLS}).map((_, c) => {
              const s = systemFor(r, c);
              const dist = Math.abs(r - CR) + Math.abs(c - CC);
              const reveal = dist === 0 ? clip(frame, 8, 28) : clip(frame, 18 + dist * 14, 46 + dist * 14);
              return <Cell key={`${r}-${c}`} r={r} c={c} sys={s} featured={isFeatured(r)} opacity={reveal} seed={r * COLS + c} />;
            }),
          )}
        </div>
      </AbsoluteFill>

      {/* paper vignette so the wall edges melt into the page */}
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 220px 70px rgba(30,38,235,0.82)'}} />

      {/* top eyebrow */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 64, textAlign: 'center', opacity: eyebrow, fontFamily: mono, fontSize: 24, letterSpacing: 7, color: bright.ink, mixBlendMode: 'multiply'}}>
        ONE CONTRACT
      </div>

      {/* the payoff */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: payoffIn}}>
        <div style={{background: 'rgba(14,18,120,0.42)', backdropFilter: 'blur(3px)', borderRadius: 24, padding: '40px 70px'}}>
          <div style={{fontFamily: mono, fontSize: 25, letterSpacing: 6, color: bright.cognac, fontWeight: 700}}>ONE CONTRACT · ANY AESTHETIC</div>
          <div style={{fontFamily: grotesk, fontSize: 132, fontWeight: 700, letterSpacing: -5, color: bright.ink, lineHeight: 1, marginTop: 12}}>
            <span style={{color: bright.cognac}}>∞</span> Infinite worlds.
          </div>
          <div style={{opacity: subIn, fontFamily: grotesk, fontStyle: 'italic', fontSize: 40, color: bright.inkSoft, marginTop: 16, fontWeight: 500}}>
            Eleven shown — and every brand you haven't built yet.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cell: React.FC<{r: number; c: number; sys: typeof SYSTEMS[number]; featured: boolean; opacity: number; seed: number}> = ({r, c, sys, featured, opacity, seed}) => {
  const left = GAP + c * (CELL_W + GAP), top = GAP + r * (CELL_H + GAP);
  const f = useCurrentFrame();
  const pan = interpolate(f, [0, DUR], [30, -30], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left, top, width: CELL_W, height: CELL_H, borderRadius: 10, overflow: 'hidden', border: `1px solid ${bright.line}`, background: '#0d0f12', opacity, boxShadow: '0 14px 36px rgba(20,12,6,0.22)'}}>
      {featured ? (
        <OffthreadVideo src={staticFile(`footage/theme-${sys.id}.mp4`)} startFrom={16 + (seed % 4) * 42} playbackRate={0.55} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.16) translateY(${pan}px)`}} />
      ) : (
        <Img src={staticFile(`world-posters/theme-${sys.id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.12) translateY(${pan * 0.5}px)`}} />
      )}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 5, background: sys.accent}} />
    </div>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
