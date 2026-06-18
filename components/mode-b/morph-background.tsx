'use client';

/**
 * MorphBackground — a chapter whose backdrop morphs between two palettes on scroll.
 *
 * Two stacked full-bleed GRADIENT layers crossfade by OPACITY as the section
 * crosses the viewport — color values never animate (taste-guardrails §1.6 /
 * §4.6, palette-temperature shift). A single progress value (--morph: 0→1) is
 * written to the stage by a rAF-throttled scroll proxy; where the browser has
 * CSS scroll-driven timelines, that native path drives --morph and the JS proxy
 * stands down. The foreground palette is fixed, so type holds AA top to floor.
 *
 * Token-driven (tokens/build/variables.css), transform/opacity only, no setState
 * in the scroll handler (§1.5/§1.8), reduced-motion freezes the calm "before"
 * state via gsap.matchMedia.
 */

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface MorphBackgroundProps {
  eyebrow?: string;
  title?: React.ReactNode;
  summary?: React.ReactNode;
  /** Stage height as a multiple of the viewport — longer = slower morph. Default 2. */
  trackVh?: number;
  /** Warm "before" gradient (CSS background value). Endpoints stay light to hold AA. */
  fromGradient?: string;
  /** Cool "after" gradient (CSS background value). */
  toGradient?: string;
}

export default function MorphBackground({
  eyebrow = 'Chapter 02 — Atmosphere',
  title = (
    <>
      The room cools <span className="mb-accent">as you descend</span> — the words never dim.
    </>
  ),
  summary = 'Two stacked gradients crossfade by opacity as the section scrolls past; the foreground palette is fixed, so contrast stays AA from warm top to cool floor.',
  trackVh = 2,
  fromGradient = 'radial-gradient(120% 120% at 18% 12%, var(--surface), var(--bg) 70%)',
  toGradient = 'radial-gradient(120% 120% at 82% 88%, #DDE6EC, #EAF0F4 72%)',
}: MorphBackgroundProps) {
  const root = useRef<HTMLElement>(null);
  const layerB = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const supportsTimeline = CSS.supports?.('animation-timeline: view()');

      // Motion branch only. Under reduced motion this never registers, so layer-b
      // stays at opacity 0 (the calm "before") — a stable non-motion fallback.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Entrance rise — once, transform/opacity only, role easing (--ease-reveal).
        gsap.from('.mb-reveal', {
          y: 40,
          opacity: 0,
          duration: 0.72,
          ease: 'power3.out',
          stagger: 0.16,
          scrollTrigger: { trigger: root.current, start: 'top 65%' },
        });

        // Native CSS scroll-timeline drives --morph where supported; skip the JS proxy.
        if (supportsTimeline) return;

        // rAF-throttled scroll proxy → one custom prop. No setState, no layout writes
        // beyond a single style.setProperty, no unthrottled listener (§1.5/§1.8).
        const stage = root.current!;
        let ticking = false;
        const update = () => {
          ticking = false;
          const r = stage.getBoundingClientRect();
          const vh = window.innerHeight;
          const p = (vh - r.top) / (vh + r.height); // travel across the viewport
          stage.style.setProperty('--morph', Math.min(1, Math.max(0, p)).toFixed(4));
        };
        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
        return () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="mb-stage"
      aria-labelledby="mb-title"
      style={{ minHeight: `${trackVh * 100}vh` }}
    >
      {/* two full-bleed gradient layers + scrim; crossfaded by opacity, never by color */}
      <div className="mb-layer mb-layer-a" aria-hidden="true" style={{ background: fromGradient }} />
      <div
        ref={layerB}
        className="mb-layer mb-layer-b"
        aria-hidden="true"
        style={{ background: toGradient }}
      />
      <div className="mb-scrim" aria-hidden="true" />

      <div className="mb-chapter">
        <p className="mb-eyebrow mb-reveal">{eyebrow}</p>
        <h2 className="mb-title mb-reveal" id="mb-title">
          {title}
        </h2>
        <p className="mb-summary mb-reveal">{summary}</p>
      </div>

      {/* Co-located token-referencing CSS; opacity-only crossfade, touch-safe, reduced-motion. */}
      <style>{`
        .mb-stage{position:relative;isolation:isolate;--morph:0;
          padding:var(--space-4xl) clamp(var(--space-lg),6vw,8rem)}
        .mb-layer{position:fixed;inset:0;z-index:-2;pointer-events:none;will-change:opacity}
        .mb-layer-b{z-index:-1;opacity:var(--morph)}
        .mb-scrim{position:fixed;inset:0;z-index:-1;pointer-events:none;
          background:linear-gradient(180deg,#F7F5F100,#F7F5F11A)}
        .mb-chapter{display:grid;align-content:center;gap:var(--space-md);min-height:100vh;
          max-width:62rem;margin-inline:auto}
        .mb-eyebrow{font-family:var(--font-ui);font-size:var(--size-caption);letter-spacing:.22em;
          text-transform:uppercase;color:var(--fg-dim)}
        .mb-title{font-family:var(--font-display);font-size:var(--fluid-h1);line-height:var(--lh-tight);
          font-weight:600;max-width:18ch}
        .mb-summary{font-size:var(--size-body-lg);color:var(--fg-dim);max-width:46ch}
        .mb-accent{color:var(--accent)}
        .mb-stage :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
        @supports (animation-timeline: view()){
          @property --morph{syntax:"<number>";inherits:true;initial-value:0}
          .mb-layer-b{animation:mb-fade linear both;animation-timeline:view();
            animation-range:cover 15% cover 85%}
          @keyframes mb-fade{from{--morph:0}to{--morph:1}}
        }
        @media (max-width:768px){
          .mb-stage{padding:var(--space-4xl) var(--space-lg)}
          .mb-title{font-size:2rem;max-width:none}
        }
        @media (prefers-reduced-motion: reduce){
          .mb-layer{will-change:auto}
          .mb-layer-b{opacity:0;animation:none}
        }
      `}</style>
    </section>
  );
}
