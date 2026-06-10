import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing, random} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';
import {MaskWipeTitle} from '../components/MaskWipeTitle';

// ────────────────────────────────────────────────────────────────────────────
// FLAGSHIP-3D film scenes — pure CSS/SVG motion graphics, zero external
// assets, fully deterministic (remotion `random()` only). The film mirrors
// the /flagship route's grammar: rail dust, four movements, the generate
// pipeline, the dancing figure.
// ────────────────────────────────────────────────────────────────────────────

const ease = Easing.out(Easing.cubic);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** The flagship's rail dust, as a deterministic CSS particle field. */
const Dust: React.FC<{count?: number; drift?: number; tint?: string}> = ({
  count = 70,
  drift = 1,
  tint = theme.teal,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const sx = random(`x${i}`) * 1920;
        const sy = random(`y${i}`) * 1080;
        const s = 1.5 + random(`s${i}`) * 3;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.05 + i * 1.7));
        const dx = Math.sin(frame * 0.013 + i * 2.1) * 26 * drift;
        const dy = Math.cos(frame * 0.011 + i * 1.3) * 18 * drift;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              width: s,
              height: s,
              borderRadius: '50%',
              background: tint,
              opacity: tw * 0.45,
              transform: `translate(${dx}px, ${dy}px)`,
              boxShadow: `0 0 ${s * 3}px ${tint}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 1 · Hook (110f) ──────────────────────────────────────────────────
export const F3DHook: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 110], [1, 1.06], {easing: Easing.inOut(Easing.quad)});
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 90% at 50% 15%, #0e2230 0%, ${theme.bgDeep} 65%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{transform: `scale(${push})`}}>
        <Dust count={90} />
      </div>
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: mono,
            color: theme.teal,
            fontSize: 26,
            letterSpacing: 10,
            marginBottom: 30,
            opacity: interpolate(frame, [4, 18], [0, 1], clamp),
          }}
        >
          OBJECT · WORLD · FIELD · FIGURE
        </div>
        <MaskWipeTitle text="Four movements" startAt={10} fontFamily={grotesk} color={theme.warm} size={150} />
        <MaskWipeTitle text="One scroll" startAt={24} fontFamily={grotesk} color={theme.teal} size={150} />
      </div>
      <Caption text="the 3D / WebXR flagship — React Three Fiber" dur={110} />
    </AbsoluteFill>
  );
};

// ─── Scene 2 · Generate pipeline (160f) ─────────────────────────────────────
const STAGES = [
  {label: 'prompt', sub: 'one sentence', icon: '✎'},
  {label: 'concept image', sub: 'nano-banana-2', icon: '◧'},
  {label: '3D mesh', sub: 'trellis · rodin', icon: '◇'},
  {label: 'web-ready .glb', sub: 'draco + webp · ~1 MB', icon: '⬡'},
];

export const F3DPipeline: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 20% 25%, ${theme.fog} 0%, ${theme.bgDeep} 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Dust count={40} drift={0.5} />
      <div style={{width: 1560}}>
        <div style={{fontFamily: mono, color: theme.teal, fontSize: 26, letterSpacing: 8, marginBottom: 56}}>
          REAL 3D ASSETS — ONE COMMAND
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 0}}>
          {STAGES.map((s, i) => {
            const t = interpolate(frame, [16 + i * 22, 16 + i * 22 + 18], [0, 1], {...clamp, easing: ease});
            const flow = interpolate(frame, [30 + i * 22, 30 + i * 22 + 20], [0, 1], {...clamp, easing: ease});
            return (
              <React.Fragment key={s.label}>
                <div
                  style={{
                    flex: '0 0 300px',
                    border: `1.5px solid ${theme.line}`,
                    borderRadius: 14,
                    padding: '34px 30px',
                    background: 'rgba(10,20,24,0.7)',
                    opacity: t,
                    transform: `translateY(${(1 - t) * 26}px)`,
                    boxShadow: t > 0.9 ? `0 0 36px rgba(94,214,198,0.12)` : 'none',
                  }}
                >
                  <div style={{fontSize: 44, color: theme.teal, marginBottom: 14}}>{s.icon}</div>
                  <div style={{fontFamily: grotesk, color: theme.warm, fontSize: 38, fontWeight: 600}}>{s.label}</div>
                  <div style={{fontFamily: mono, color: theme.sub, fontSize: 22, marginTop: 8}}>{s.sub}</div>
                </div>
                {i < STAGES.length - 1 ? (
                  <div style={{flex: 1, height: 2, background: theme.line, position: 'relative', margin: '0 6px'}}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${flow * 100}%`,
                        background: theme.teal,
                        boxShadow: `0 0 14px ${theme.teal}`,
                      }}
                    />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 64,
            fontFamily: mono,
            fontSize: 30,
            color: theme.warm,
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${theme.line}`,
            borderRadius: 10,
            padding: '20px 28px',
            display: 'inline-block',
            opacity: interpolate(frame, [104, 122], [0, 1], clamp),
          }}
        >
          <span style={{color: theme.sub}}>$</span> npm run generate:flagship{' '}
          <span style={{color: theme.teal}}>--apply</span>
        </div>
      </div>
      <Caption text="auto-compressed · auto-normalized · zero code change" dur={160} />
    </AbsoluteFill>
  );
};

// ─── Scene 3 · The four movements (360f = 4 × 90f) ──────────────────────────
const MOVEMENTS = [
  {roman: 'I', name: 'The Object', accent: '#3de0ff', note: 'a hero artifact, orbiting glint, AR at true scale'},
  {roman: 'II', name: 'The World', accent: '#5ED6C6', note: 'an instanced hall, volumetric shafts, room-scale VR'},
  {roman: 'III', name: 'The Field', accent: '#9a6cff', note: 'pure GLSL — zero assets, the always-works hero'},
  {roman: 'IV', name: 'The Figure', accent: '#ffb270', note: 'a rigged dancer on a breathing stage ring'},
];

const MovementVisual: React.FC<{i: number; accent: string; local: number}> = ({i, accent, local}) => {
  // One emblem per movement, all animated from `local` (0→90).
  const spin = local * 1.2;
  if (i === 0) {
    // OBJECT — rotating faceted diamond
    return (
      <svg width="420" height="420" viewBox="-110 -110 220 220">
        <g transform={`rotate(${spin})`}>
          <polygon points="0,-86 74,0 0,86 -74,0" fill="none" stroke={accent} strokeWidth="2.5" />
          <polygon points="0,-52 44,0 0,52 -44,0" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <circle r="6" fill={accent} />
        </g>
      </svg>
    );
  }
  if (i === 1) {
    // WORLD — colonnade perspective lines converging
    const d = (local % 30) / 30;
    return (
      <svg width="420" height="420" viewBox="0 0 220 220">
        {Array.from({length: 7}, (_, k) => {
          const p = ((k + d) % 7) / 7;
          const w = 10 + p * 200;
          const o = p * 0.9;
          return (
            <rect
              key={k}
              x={110 - w / 2}
              y={110 - w / 2.6}
              width={w}
              height={w / 1.3}
              fill="none"
              stroke={accent}
              strokeWidth={1 + p * 1.6}
              opacity={o}
            />
          );
        })}
      </svg>
    );
  }
  if (i === 2) {
    // FIELD — flowing sine filaments
    return (
      <svg width="520" height="420" viewBox="0 0 260 210">
        {Array.from({length: 6}, (_, k) => {
          const pts = Array.from({length: 40}, (_, x) => {
            const px = (x / 39) * 260;
            const py = 105 + Math.sin(x * 0.32 + local * 0.07 + k * 1.1) * (18 + k * 7);
            return `${px},${py}`;
          }).join(' ');
          return <polyline key={k} points={pts} fill="none" stroke={accent} strokeWidth="1.6" opacity={0.25 + k * 0.12} />;
        })}
      </svg>
    );
  }
  // FIGURE — pulsing stage ring + bobbing presence
  const pulse = 1 + Math.sin(local * 0.14) * 0.05;
  const bob = Math.sin(local * 0.2) * 8;
  return (
    <svg width="420" height="420" viewBox="-110 -110 220 220">
      <ellipse cx="0" cy="74" rx={66 * pulse} ry={16 * pulse} fill="none" stroke={accent} strokeWidth="4" opacity="0.9" />
      <circle cx="0" cy={-38 + bob} r="14" fill={accent} />
      <line x1="0" y1={-24 + bob} x2="0" y2={34 + bob * 0.5} stroke={accent} strokeWidth="6" strokeLinecap="round" />
      <line x1="-26" y1={-2 + bob * 0.8} x2="26" y2={6 + bob * 0.4} stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <line x1="0" y1={34 + bob * 0.5} x2="-20" y2="72" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <line x1="0" y1={34 + bob * 0.5} x2="22" y2="70" stroke={accent} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

export const F3DMovements: React.FC = () => {
  const frame = useCurrentFrame();
  const i = Math.min(Math.floor(frame / 90), 3);
  const local = frame - i * 90;
  const m = MOVEMENTS[i];
  const inT = interpolate(local, [0, 16], [0, 1], {...clamp, easing: ease});
  const outT = interpolate(local, [78, 90], [1, 0], clamp);
  const o = Math.min(inT, outT);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 95% at 70% 20%, ${m.accent}14 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
      }}
    >
      <Dust count={50} tint={m.accent} />
      <div style={{display: 'flex', alignItems: 'center', paddingLeft: 150, gap: 100, opacity: o}}>
        <div style={{transform: `translateX(${(1 - inT) * -40}px)`}}>
          <div style={{fontFamily: mono, color: m.accent, fontSize: 26, letterSpacing: 8, marginBottom: 24}}>
            MOVEMENT {m.roman}
          </div>
          <div style={{fontFamily: serif, color: theme.warm, fontSize: 130, fontWeight: 600, lineHeight: 1}}>
            {m.name}
          </div>
          <div style={{fontFamily: mono, color: theme.sub, fontSize: 28, marginTop: 30, maxWidth: 700}}>{m.note}</div>
        </div>
        <div style={{transform: `translateX(${(1 - inT) * 40}px)`, opacity: 0.95}}>
          <MovementVisual i={i} accent={m.accent} local={local} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4 · The dancer (120f) ────────────────────────────────────────────
export const F3DDancer: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.16) * 0.05;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(100% 90% at 50% 100%, #2a160a 0%, ${theme.bgDeep} 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Dust count={60} tint="#ffb270" drift={1.4} />
      {/* spotlight cone */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 560,
          height: 760,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(255,178,112,0.30), rgba(255,178,112,0))',
          clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
          opacity: 0.8 + Math.sin(frame * 0.11) * 0.2,
        }}
      />
      <div style={{textAlign: 'center', zIndex: 1}}>
        <MaskWipeTitle text="It dances" startAt={6} fontFamily={grotesk} color={theme.warm} size={150} />
        <MaskWipeTitle text="out of the box" startAt={20} fontFamily={grotesk} color="#ffb270" size={150} />
        <div
          style={{
            marginTop: 44,
            fontFamily: mono,
            color: theme.sub,
            fontSize: 27,
            letterSpacing: 2,
            opacity: interpolate(frame, [40, 56], [0, 1], clamp),
          }}
        >
          dancer.glb · rigged + animated · 0.8 MB draco'd · root motion stripped
        </div>
      </div>
      {/* stage ring */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: '50%',
          width: 460 * pulse,
          height: 110 * pulse,
          transform: 'translateX(-50%)',
          border: '5px solid #ffb270',
          borderRadius: '50%',
          boxShadow: '0 0 60px rgba(255,178,112,0.55), inset 0 0 40px rgba(255,178,112,0.25)',
          opacity: interpolate(frame, [10, 26], [0, 1], clamp),
        }}
      />
      <Caption text="no Blender · no Mixamo account · no manual step" dur={120} accent="#ffb270" />
    </AbsoluteFill>
  );
};

// ─── Scene 5 · End card (150f) ──────────────────────────────────────────────
export const F3DEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [6, 24], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 90% at 50% 10%, #0e2230 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Dust count={70} drift={0.6} />
      <div style={{textAlign: 'center', opacity: o}}>
        <div style={{fontFamily: serif, color: theme.warm, fontSize: 92, fontStyle: 'italic', marginBottom: 18}}>
          The motion is the constant.
        </div>
        <div style={{fontFamily: serif, color: theme.teal, fontSize: 92, fontStyle: 'italic', marginBottom: 70}}>
          The look is yours.
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 30,
            color: theme.warm,
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${theme.line}`,
            borderRadius: 10,
            padding: '20px 30px',
            display: 'inline-block',
          }}
        >
          npx skills add MustBeSimo/cinematic-scroll-skill
        </div>
        <div style={{fontFamily: mono, color: theme.sub, fontSize: 24, letterSpacing: 3, marginTop: 36}}>
          github.com/MustBeSimo/cinematic-scroll-skill
        </div>
      </div>
    </AbsoluteFill>
  );
};
