'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

/**
 * MagneticCursor — a custom cursor dot that rAF-lerps toward the pointer and
 * snaps toward magnetic targets (real <a>/<button> carrying `data-magnetic`).
 *
 * DEGRADE CONTRACT (guardrail 1.9): the whole effect lives inside a
 * gsap.matchMedia branch gated to `(hover:hover) and (pointer:fine)` AND
 * `(prefers-reduced-motion: no-preference)`. On touch or reduced-motion the
 * branch never runs, the dot stays `display:none`, and the native cursor is used.
 * The dot is decorative (aria-hidden); targets remain real focusable elements.
 *
 * Tokens: pulls --accent / --fg / --dur-base / --ease-reveal from the cascade.
 */
export interface MagneticCursorProps {
  /** Querystring for magnetic targets. Must resolve to real <a>/<button>. */
  targets?: string;
  /** Follow speed (0–1). Higher = snappier trail. */
  lerp?: number;
  /** Magnet strength (0–1). How far the rest point leans toward a target. */
  pull?: number;
  /** Dot scale while snapped to a target. */
  snapScale?: number;
}

export function MagneticCursor({
  targets = '[data-magnetic]',
  lerp = 0.18,
  pull = 0.35,
  snapScale = 2.4,
}: MagneticCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    // Only fine pointers with motion allowed opt in — touch/RM keep native cursor.
    mm.add(
      '(hover:hover) and (pointer:fine) and (prefers-reduced-motion: no-preference)',
      () => {
        const dot = dotRef.current!;
        document.documentElement.classList.add('has-cursor');
        gsap.set(dot, { display: 'block', autoAlpha: 1, xPercent: -50, yPercent: -50 });

        // quickTo handles the eased translate/scale on the compositor (no React state).
        const xTo = gsap.quickTo(dot, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(dot, 'y', { duration: 0.4, ease: 'power3' });
        const sTo = gsap.quickTo(dot, 'scale', { duration: 0.35, ease: 'back.out(2)' });

        let px = innerWidth / 2, py = innerHeight / 2;
        let snap: Element | null = null;

        const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
        addEventListener('pointermove', onMove, { passive: true });

        const els = Array.from(document.querySelectorAll(targets));
        const enter = (e: Event) => { snap = e.currentTarget as Element; dot.dataset.snapped = 'true'; sTo(snapScale); };
        const leave = () => { snap = null; delete dot.dataset.snapped; sTo(1); };
        els.forEach((el) => {
          el.addEventListener('pointerenter', enter);
          el.addEventListener('pointerleave', leave);
        });

        // Single rAF tick lerps the rest point; quickTo eases the actual paint.
        const tick = () => {
          let tx = px, ty = py;
          if (snap) {
            const r = snap.getBoundingClientRect();
            tx = px + (r.left + r.width / 2 - px) * pull;
            ty = py + (r.top + r.height / 2 - py) * pull;
          }
          xTo(gsap.utils.interpolate(gsap.getProperty(dot, 'x') as number, tx, lerp));
          yTo(gsap.utils.interpolate(gsap.getProperty(dot, 'y') as number, ty, lerp));
        };
        gsap.ticker.add(tick);

        // Cleanup when the media query stops matching or the component unmounts.
        return () => {
          gsap.ticker.remove(tick);
          removeEventListener('pointermove', onMove);
          els.forEach((el) => {
            el.removeEventListener('pointerenter', enter);
            el.removeEventListener('pointerleave', leave);
          });
          document.documentElement.classList.remove('has-cursor');
        };
      },
    );
  }, { dependencies: [targets, lerp, pull, snapScale] });

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'var(--accent)',
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'none',
        willChange: 'transform',
        transition:
          'background-color var(--dur-base) var(--ease-reveal), opacity var(--dur-base) var(--ease-reveal)',
      }}
    />
  );
}

export default MagneticCursor;
