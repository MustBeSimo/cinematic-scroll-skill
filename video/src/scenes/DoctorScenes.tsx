import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing, random} from 'remotion';
import {grotesk, mono} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';
import {MaskWipeTitle} from '../components/MaskWipeTitle';

// ────────────────────────────────────────────────────────────────────────────
// DOCTOR film scenes — the cinematic-doctor quality gate. Pure CSS/SVG motion
// graphics, zero external assets, fully deterministic (remotion `random()`
// only). The film's argument: cinematic taste is now a number you can gate on.
// ────────────────────────────────────────────────────────────────────────────

const ease = Easing.out(Easing.cubic);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const CATEGORIES = [
  {id: 'taste', label: 'TASTE', score: 92, tint: theme.teal},
  {id: 'performance', label: 'PERFORMANCE', score: 88, tint: '#7BD88F'},
  {id: 'a11y', label: 'ACCESSIBILITY', score: 85, tint: '#C9A227'},
  {id: 'mobile', label: 'MOBILE', score: 84, tint: '#9a6cff'},
  {id: 'threed', label: '3D', score: 86, tint: theme.crimson},
] as const;

/** Faint diagnostic grid — the film's air. */
const ScanGrid: React.FC<{opacity?: number}> = ({opacity = 0.5}) => {
  const frame = useCurrentFrame();
  const sweep = (frame * 6) % 1400 - 160;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${theme.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.line} 1px, transparent 1px)`,
          backgroundSize: '96px 96px',
          opacity: 0.5,
        }}
      />
      {/* scanline sweeping down — the doctor reading the page */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: sweep,
          height: 120,
          background: `linear-gradient(180deg, transparent, ${theme.fog}, transparent)`,
          opacity: 0.35,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Scene 1 · Hook (100f) ──────────────────────────────────────────────────
export const DocHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 90% at 50% 20%, #0a1a1c 0%, ${theme.bgDeep} 65%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ScanGrid />
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: mono,
            color: theme.teal,
            fontSize: 26,
            letterSpacing: 10,
            marginBottom: 34,
            opacity: interpolate(frame, [4, 18], [0, 1], clamp),
          }}
        >
          CINEMATIC-DOCTOR
        </div>
        <MaskWipeTitle text="Taste," startAt={14} fontFamily={grotesk} color={theme.warm} size={170} />
        <MaskWipeTitle text="scored." startAt={30} fontFamily={grotesk} color={theme.teal} size={170} />
        <div
          style={{
            fontFamily: mono,
            color: theme.sub,
            fontSize: 28,
            letterSpacing: 3,
            marginTop: 40,
            opacity: interpolate(frame, [56, 72], [0, 1], clamp),
          }}
        >
          Cinematic slop stops at the gate.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2 · Scan (150f) — the doctor reads the build ────────────────────
const SCAN_LINES = [
  {t: '$ npm run doctor -- examples/noir/index.html', tint: theme.warm, at: 8},
  {t: '▸ taste        pinned chapters · mask reveals · pacing', tint: theme.sub, at: 34},
  {t: '▸ performance  transform/opacity hot paths · layer budget', tint: theme.sub, at: 50},
  {t: '▸ a11y         prefers-reduced-motion · contrast · focus', tint: theme.sub, at: 66},
  {t: '▸ mobile       stacked layout · touch targets · weight', tint: theme.sub, at: 82},
  {t: '▸ 3d           draco budget · normalize · xr freeze', tint: theme.sub, at: 98},
] as const;

export const DocScan: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 30% 10%, #0a1a1c 0%, ${theme.bgDeep} 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ScanGrid opacity={0.35} />
      <div
        style={{
          width: 1320,
          background: 'rgba(8, 16, 18, 0.82)',
          border: `1px solid ${theme.line}`,
          padding: '52px 64px',
          opacity: interpolate(frame, [0, 14], [0, 1], clamp),
          transform: `translateY(${interpolate(frame, [0, 16], [26, 0], {...clamp, easing: ease})}px)`,
        }}
      >
        {SCAN_LINES.map((l, i) => {
          const on = interpolate(frame, [l.at, l.at + 10], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                fontFamily: mono,
                fontSize: i === 0 ? 34 : 28,
                lineHeight: 1.9,
                color: i === 0 ? theme.teal : l.tint,
                opacity: on,
                transform: `translateX(${(1 - on) * -14}px)`,
              }}
            >
              {l.t}
              {/* per-line verdict ticks in a beat after the line lands */}
              {i > 0 && (
                <span
                  style={{
                    color: theme.teal,
                    marginLeft: 18,
                    opacity: interpolate(frame, [l.at + 22, l.at + 30], [0, 1], clamp),
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Caption text="Five disciplines. One pass." dur={150} />
    </AbsoluteFill>
  );
};

// ─── Scene 3 · Score (200f) — the number arrives ────────────────────────────
export const DocScore: React.FC = () => {
  const frame = useCurrentFrame();
  // The count-up: 0 → 87 over 70f with a cubic-out so it lands heavy.
  const p = interpolate(frame, [16, 86], [0, 1], {...clamp, easing: ease});
  const score = Math.round(p * 87);
  const landed = frame >= 86;
  const pulse = landed ? 1 + Math.sin((frame - 86) * 0.18) * 0.012 : 1;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(100% 90% at 50% 100%, #0c1f1d 0%, ${theme.bgDeep} 60%)`,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 140,
      }}
    >
      <ScanGrid opacity={0.3} />
      {/* the number */}
      <div style={{textAlign: 'center', transform: `scale(${pulse})`}}>
        <div
          style={{
            fontFamily: grotesk,
            fontWeight: 700,
            fontSize: 380,
            lineHeight: 0.9,
            color: theme.warm,
            letterSpacing: -10,
            textShadow: landed ? `0 0 90px ${theme.fog}` : 'none',
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontFamily: mono,
            color: theme.sub,
            fontSize: 26,
            letterSpacing: 8,
            marginTop: 18,
            opacity: interpolate(frame, [90, 104], [0, 1], clamp),
          }}
        >
          / 100 · examples/noir
        </div>
      </div>
      {/* the category bars */}
      <div style={{width: 560}}>
        {CATEGORIES.map((c, i) => {
          const at = 26 + i * 14;
          const fill = interpolate(frame, [at, at + 36], [0, c.score], {...clamp, easing: ease});
          return (
            <div key={c.id} style={{marginBottom: 34, opacity: interpolate(frame, [at - 6, at + 6], [0, 1], clamp)}}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: mono,
                  fontSize: 24,
                  letterSpacing: 3,
                  color: theme.sub,
                  marginBottom: 10,
                }}
              >
                <span>{c.label}</span>
                <span style={{color: c.tint}}>{Math.round(fill)}</span>
              </div>
              <div style={{height: 8, background: 'rgba(120,150,150,0.14)'}}>
                <div
                  style={{
                    height: '100%',
                    width: `${fill}%`,
                    background: c.tint,
                    boxShadow: `0 0 16px ${c.tint}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Caption text="0–100 across taste · perf · a11y · mobile · 3D" dur={200} />
    </AbsoluteFill>
  );
};

// ─── Scene 4 · Gate (130f) — below 80, the build does not ship ──────────────
export const DocGate: React.FC = () => {
  const frame = useCurrentFrame();
  // Two verdict cards: a 64 that gets blocked, an 87 that passes.
  const failIn = interpolate(frame, [10, 26], [0, 1], {...clamp, easing: ease});
  const passIn = interpolate(frame, [52, 68], [0, 1], {...clamp, easing: ease});
  const stamp = interpolate(frame, [78, 88], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 90% at 50% 0%, #14090b 0%, ${theme.bgDeep} 58%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ScanGrid opacity={0.25} />
      <div
        style={{
          fontFamily: mono,
          color: theme.sub,
          fontSize: 26,
          letterSpacing: 6,
          marginBottom: 56,
          opacity: interpolate(frame, [0, 12], [0, 1], clamp),
        }}
      >
        THE GATE — EXITS NON-ZERO BELOW 80
      </div>
      <div style={{display: 'flex', gap: 70}}>
        <div
          style={{
            width: 540,
            border: `1px solid rgba(232,72,79,0.45)`,
            background: 'rgba(20, 8, 10, 0.8)',
            padding: '44px 52px',
            opacity: failIn,
            transform: `translateY(${(1 - failIn) * 30}px)`,
          }}
        >
          <div style={{fontFamily: grotesk, fontWeight: 700, fontSize: 120, color: theme.crimson, lineHeight: 1}}>64</div>
          <div style={{fontFamily: mono, fontSize: 24, color: theme.sub, letterSpacing: 2, marginTop: 16}}>
            scroll-jack hero · no reduced-motion · 14 MB of mesh
          </div>
          <div style={{fontFamily: mono, fontSize: 28, color: theme.crimson, letterSpacing: 4, marginTop: 26}}>
            ✕ exit 1 — build blocked
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            width: 540,
            border: `1px solid rgba(94,214,198,0.45)`,
            background: 'rgba(8, 18, 17, 0.8)',
            padding: '44px 52px',
            opacity: passIn,
            transform: `translateY(${(1 - passIn) * 30}px)`,
          }}
        >
          <div style={{fontFamily: grotesk, fontWeight: 700, fontSize: 120, color: theme.teal, lineHeight: 1}}>87</div>
          <div style={{fontFamily: mono, fontSize: 24, color: theme.sub, letterSpacing: 2, marginTop: 16}}>
            pinned chapters · still-frame fallback · draco'd
          </div>
          <div style={{fontFamily: mono, fontSize: 28, color: theme.teal, letterSpacing: 4, marginTop: 26}}>
            ✓ exit 0 — ships
          </div>
          {/* the pass stamp slams in */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              right: 30,
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 6,
              color: theme.teal,
              border: `3px solid ${theme.teal}`,
              padding: '10px 22px',
              transform: `rotate(-9deg) scale(${stamp})`,
              opacity: stamp,
            }}
          >
            PASS
          </div>
        </div>
      </div>
      <Caption text="Wire it into CI. Quality is a contract, not a vibe." dur={130} accent={theme.crimson} />
    </AbsoluteFill>
  );
};

// ─── Scene 5 · End card (140f) ──────────────────────────────────────────────
export const DocEnd: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(110% 90% at 50% 15%, #0a1a1c 0%, ${theme.bgDeep} 65%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* a few resting motes so the end card still breathes */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {Array.from({length: 40}, (_, i) => {
          const x = random(`ex${i}`) * 1920;
          const y = random(`ey${i}`) * 1080;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.04 + i * 1.9));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 2.5,
                height: 2.5,
                borderRadius: '50%',
                background: theme.teal,
                opacity: tw * 0.35,
              }}
            />
          );
        })}
      </AbsoluteFill>
      <div style={{textAlign: 'center'}}>
        <MaskWipeTitle text="Cinematic Scroll" startAt={6} fontFamily={grotesk} color={theme.warm} size={120} />
        <div
          style={{
            fontFamily: mono,
            color: theme.teal,
            fontSize: 30,
            letterSpacing: 4,
            marginTop: 38,
            opacity: interpolate(frame, [30, 44], [0, 1], clamp),
          }}
        >
          npm run doctor -- your-page.html
        </div>
        <div
          style={{
            fontFamily: mono,
            color: theme.sub,
            fontSize: 26,
            letterSpacing: 2,
            marginTop: 22,
            opacity: interpolate(frame, [44, 58], [0, 1], clamp),
          }}
        >
          github.com/MustBeSimo/cinematic-scroll-skill
        </div>
      </div>
    </AbsoluteFill>
  );
};
