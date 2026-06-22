import React from 'react';
import {AbsoluteFill, OffthreadVideo, Img, staticFile, useCurrentFrame, interpolate, Easing} from 'remotion';
import {grotesk, mono} from '../../fonts';
import {bright} from '../../theme';

// v2.4.0 — THE WALL OF ELEVEN SYSTEMS (vertical 9:16). The 1080×1920 twin of the
// 16:9 ElevenWorlds: eleven real, image-rich themed brand sites in a grid that
// pulls back, proving one token contract drives the whole range.
const SYSTEMS = [
  {id: 'symmetric-monument',  index: '01', title: 'MERIDIAN',          accent: '#C41E3A'},
  {id: 'clinical-noir',       index: '02', title: 'VANTA LABS',        accent: '#C9A96E'},
  {id: 'storybook-geometry',  index: '03', title: 'POLLY & PLOT',      accent: '#D4738C'},
  {id: 'temporal-monument',   index: '04', title: 'OBSIDIAN',          accent: '#E8C97A'},
  {id: 'atmospheric-sublime', index: '05', title: 'FARSIGHT',          accent: '#B8956A'},
  {id: 'warm-scrapbook',      index: '06', title: 'KEEPSAKE',          accent: '#E8927C'},
  {id: 'naturalistic-drift',  index: '07', title: 'DRIFT',             accent: '#5E7050'},
  {id: 'brutalist-kinetic',   index: '08', title: 'CONCRETE/ORANGE',   accent: '#FF4D00'},
  {id: 'liquid-chrome',       index: '09', title: 'CHROMA',            accent: '#7DF9FF'},
  {id: 'botanical-editorial', index: '10', title: 'VERDANT PRESS',     accent: '#4A6B3A'},
  {id: 'data-cinematic',      index: '11', title: 'SIGNAL',            accent: '#4FE0B0'},
];

const COLS = 3, ROWS = 15, GAP = 14, GRID_W = 1080;
const CELL_W = (GRID_W - GAP * (COLS + 1)) / COLS;
const CELL_H = (CELL_W * 9) / 16;
const GRID_H = ROWS * CELL_H + (ROWS + 1) * GAP;
const CR = 7, CC = 1;
const CENTER_N = CR * COLS + CC;
function systemFor(r: number, c: number) {
  const n = r * COLS + c;
  return SYSTEMS[((n - CENTER_N) * 4 + 7 + 110) % 11];
}
const isFeatured = (r: number) => r >= 6 && r <= 8;
const DUR = 480;

export const VElevenWorlds: React.FC = () => {
  const frame = useCurrentFrame();
  const ease = Easing.inOut(Easing.cubic);

  const scale = interpolate(frame, [0, 180, 360, DUR], [1.0, 1.0, 0.5, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const driftY = interpolate(frame, [180, DUR], [0, -320], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const tilt = interpolate(frame, [180, 420], [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const gridOp = clip(frame, 6, 40);
  const tail = interpolate(frame, [DUR - 16, DUR], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const eyebrow = interpolate(frame, [10, 30, 150, 178], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const payoffIn = interpolate(frame, [250, 290, 430, 466], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subIn = clip(frame, 312, 348);

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, overflow: 'hidden', opacity: tail}}>
      <AbsoluteFill style={{perspective: 2000, justifyContent: 'center', alignItems: 'center', opacity: gridOp}}>
        <div style={{position: 'relative', width: GRID_W, height: GRID_H, transform: `translateY(${driftY}px) rotateX(${tilt}deg) scale(${scale})`, transformStyle: 'preserve-3d'}}>
          {Array.from({length: ROWS}).map((_, r) =>
            Array.from({length: COLS}).map((_, c) => {
              const s = systemFor(r, c);
              const dist = Math.abs(r - CR) + Math.abs(c - CC);
              const reveal = dist === 0 ? clip(frame, 8, 28) : clip(frame, 18 + dist * 12, 46 + dist * 12);
              return <Cell key={`${r}-${c}`} r={r} c={c} sys={s} featured={isFeatured(r)} opacity={reveal} seed={r * COLS + c} />;
            }),
          )}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 200px 60px rgba(30,38,235,0.82)'}} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', opacity: eyebrow, fontFamily: mono, fontSize: 30, letterSpacing: 7, color: bright.ink, mixBlendMode: 'multiply'}}>
        ONE CONTRACT
      </div>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: payoffIn, padding: '0 40px'}}>
        <div style={{background: 'rgba(14,18,120,0.46)', backdropFilter: 'blur(3px)', borderRadius: 26, padding: '44px 40px'}}>
          <div style={{fontFamily: mono, fontSize: 21, letterSpacing: 3, color: bright.cognac, fontWeight: 700, lineHeight: 1.5}}>ONE CONTRACT<br />ANY AESTHETIC</div>
          <div style={{fontFamily: grotesk, fontSize: 120, fontWeight: 700, letterSpacing: -4, color: bright.ink, lineHeight: 0.98, marginTop: 16}}>
            <span style={{color: bright.cognac}}>∞</span><br />Infinite<br />worlds.
          </div>
          <div style={{opacity: subIn, fontFamily: grotesk, fontStyle: 'italic', fontSize: 36, color: bright.inkSoft, marginTop: 22, fontWeight: 500, lineHeight: 1.25}}>
            Eleven shown.<br />Every brand you<br />haven't built yet.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cell: React.FC<{r: number; c: number; sys: typeof SYSTEMS[number]; featured: boolean; opacity: number; seed: number}> = ({r, c, sys, featured, opacity, seed}) => {
  const left = GAP + c * (CELL_W + GAP), top = GAP + r * (CELL_H + GAP);
  const f = useCurrentFrame();
  const pan = interpolate(f, [0, DUR], [26, -26], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left, top, width: CELL_W, height: CELL_H, borderRadius: 8, overflow: 'hidden', border: `1px solid ${bright.line}`, background: '#0d0f12', opacity, boxShadow: '0 10px 28px rgba(20,12,6,0.22)'}}>
      {featured ? (
        <OffthreadVideo src={staticFile(`footage/theme-${sys.id}.mp4`)} startFrom={16 + (seed % 4) * 42} playbackRate={0.55} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.18) translateY(${pan}px)`}} />
      ) : (
        <Img src={staticFile(`world-posters/theme-${sys.id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.12) translateY(${pan * 0.5}px)`}} />
      )}
      <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 4, background: sys.accent}} />
    </div>
  );
};

function clip(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
