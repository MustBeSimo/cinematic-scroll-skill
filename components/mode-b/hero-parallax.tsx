'use client';

/**
 * HeroParallax — a "tracking shot": graded depth planes drift at different
 * scroll rates so the frame reads as a deep space, not a flat image.
 *
 * Motion, layered:
 *   1. Parallax — each plane translateY-scrubs by its own depth multiplier as
 *      the hero crosses the viewport (transform-only, ScrollTrigger scrub).
 *   2. Title reveal — split-line rise on enter (transform + opacity only).
 *
 * Depth multipliers are deliberately non-rhythmic (guardrails §4.3): far/back/
 * mid/near. On mobile we collapse to <=2 planes (guardrails §1.7 / §4.7) and
 * under reduced motion everything goes static (guardrails §1.9). Parallax is
 * scrubbed, never per-event setState (§1.5 / §1.8). All visuals reference the
 * same CSS token vars as Mode A (design.md / tokens/build/variables.css).
 */

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

/** A single depth plane. `depth` is its scroll-rate multiplier (far→near). */
export type ParallaxPlane = {
  /** Scroll-rate multiplier. ~0.15 = far/slow, ~1.2 = near/fast. */
  depth: number;
  /** Plane contents (decorative — the layer is aria-hidden). */
  children?: React.ReactNode;
  /** Drop this plane on mobile to honour the <=2-layer collapse (§1.7). */
  hideOnMobile?: boolean;
  /** Optional per-plane style (background gradient, z-index, etc.). */
  style?: React.CSSProperties;
};

export type HeroParallaxProps = {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Title lines — each rises independently on enter. */
  titleLines: React.ReactNode[];
  /** Supporting paragraph under the title. */
  summary?: React.ReactNode;
  /**
   * Depth planes back-to-front. Keep at most ~4 desktop / 2 mobile (§1.7).
   * Defaults to far/back/mid with `back` hidden on mobile.
   */
  planes?: ParallaxPlane[];
  /** Peak parallax travel at depth 1.0, in vh (default 22). */
  travel?: number;
  id?: string;
  className?: string;
};

const DEFAULT_PLANES: ParallaxPlane[] = [
  { depth: 0.16, style: { zIndex: 1, background: 'radial-gradient(120% 90% at 50% -10%, var(--surface), var(--bg) 60%)' } },
  { depth: 0.34, hideOnMobile: true, style: { zIndex: 2, background: 'repeating-linear-gradient(115deg, var(--line) 0 1px, transparent 1px 92px)' } },
  {
    depth: 0.62,
    style: { zIndex: 3, display: 'grid', placeItems: 'center' },
    children: (
      <div
        style={{
          width: 'min(56vw, 30rem)',
          aspectRatio: '4 / 5',
          borderRadius: '2px',
          background: 'linear-gradient(160deg, var(--surface), var(--bg))',
          border: '1px solid var(--line)',
          boxShadow: '0 30px 80px -40px var(--fg)',
        }}
      />
    ),
  },
];

export function HeroParallax({
  eyebrow,
  titleLines,
  summary,
  planes = DEFAULT_PLANES,
  travel = 22,
  id = 'hero',
  className,
}: HeroParallaxProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // gsap.matchMedia scopes each branch and auto-reverts on resize/teardown.
      const mm = gsap.matchMedia();

      // Motion branch only — reduced-motion gets the static composition (§1.9).
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Title reveal — split lines rise + eyebrow/summary fade up on enter.
        const lines = root.current!.querySelectorAll<HTMLElement>('[data-line] > span');
        gsap.from(lines, {
          yPercent: 110,
          autoAlpha: 0,
          duration: 0.72,
          stagger: 0.09,
          ease: 'power3.out', // mirrors --ease-reveal cubic-bezier(.16,1,.3,1)
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });
        gsap.from(root.current!.querySelectorAll<HTMLElement>('[data-fade]'), {
          y: 40,
          autoAlpha: 0,
          duration: 0.72,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });

        // Parallax — one scrub per visible plane, transform-only. ScrollTrigger
        // handles rAF throttling; no scroll listener, no setState (§1.5 / §1.8).
        // offsetParent === null skips planes display:none'd on mobile.
        const planeEls = root.current!.querySelectorAll<HTMLElement>('[data-depth]');
        planeEls.forEach((el) => {
          if (el.offsetParent === null) return;
          const d = parseFloat(el.dataset.depth!);
          gsap.fromTo(
            el,
            { yPercent: 0 },
            {
              yPercent: -travel * d,
              ease: 'none',
              scrollTrigger: {
                trigger: root.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      });
    },
    { scope: root, dependencies: [planes, travel] },
  );

  return (
    <section
      ref={root}
      id={id}
      className={className}
      aria-labelledby={`${id}-title`}
      style={{ position: 'relative', minHeight: '100vh', overflow: 'clip' }}
    >
      {/* sticky frame: steady camera, planes drift within it */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'clip',
          display: 'grid',
          placeItems: 'center',
          isolation: 'isolate',
        }}
      >
        {planes.map((p, i) => (
          <div
            key={i}
            data-depth={p.depth}
            aria-hidden="true"
            data-hide-mobile={p.hideOnMobile ? '' : undefined}
            style={{
              position: 'absolute',
              inset: '-12% 0',
              willChange: 'transform',
              transform: 'translate3d(0,0,0)',
              ...p.style,
            }}
          >
            {p.children}
          </div>
        ))}

        {/* copy sits at depth 1.0 — above mid plane, no parallax on body type (§1.4) */}
        <div
          style={{
            position: 'relative',
            zIndex: 4,
            maxWidth: '62rem',
            padding: '0 clamp(var(--space-lg), 6vw, 8rem)',
            textAlign: 'left',
          }}
        >
          {eyebrow ? (
            <p
              data-fade
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--size-caption)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--fg-dim)',
              }}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            id={`${id}-title`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fluid-h1)',
              lineHeight: 'var(--lh-tight)',
              fontWeight: 600,
              maxWidth: '16ch',
              marginTop: 'var(--space-md)',
            }}
          >
            {titleLines.map((line, i) => (
              <span key={i} data-line style={{ display: 'block', overflow: 'clip' }}>
                <span style={{ display: 'inline-block' }}>{line}</span>
              </span>
            ))}
          </h1>

          {summary ? (
            <p
              data-fade
              style={{
                fontSize: 'var(--size-body-lg)',
                color: 'var(--fg-dim)',
                maxWidth: '42ch',
                marginTop: 'var(--space-lg)',
              }}
            >
              {summary}
            </p>
          ) : null}
        </div>
      </div>

      {/* Collapse to <=2 planes on mobile + a focus-visible ring (guardrails §1.7). */}
      <style>{`
        @media (max-width: 768px){
          #${id} [data-hide-mobile]{ display:none }
          #${id} h1{ font-size:2rem; max-width:none }
        }
        #${id} :focus-visible{ outline:2px solid var(--accent); outline-offset:3px }
      `}</style>
    </section>
  );
}
