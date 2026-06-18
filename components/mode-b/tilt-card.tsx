'use client';

/**
 * TiltCard — a card that tilts ~8deg toward the pointer with an opacity-only
 * specular sheen. Pointer-3D is gated to hover + fine pointer via gsap.matchMedia
 * and is silently disabled on touch / reduced-motion (taste-guardrails 1.9):
 * those users get the stable flat card, no listeners attached.
 *
 * Expects the design tokens (tokens/build/variables.css) on :root.
 * Drives only transform + opacity through GSAP quickTo (one write per frame).
 */

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

type TiltCardProps = {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  /** Max tilt in degrees on each axis. Keep subtle — never queasy. */
  maxDeg?: number;
};

export function TiltCard({ eyebrow, title, children, maxDeg = 8 }: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      // Only this branch ever runs: real hover + fine pointer, motion allowed.
      mm.add(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const sheen = el.querySelector<HTMLElement>('[data-sheen]');
          // quickTo: GSAP reuses one tween per property — no per-frame allocation.
          const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
          const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });

          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5; // -.5..+.5
            const ny = (e.clientY - r.top) / r.height - 0.5;
            rx(-ny * maxDeg);
            ry(nx * maxDeg);
            if (sheen) {
              sheen.style.setProperty('--gx', `${(nx + 0.5) * 100}%`);
              sheen.style.setProperty('--gy', `${(ny + 0.5) * 100}%`);
              gsap.to(sheen, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
            }
          };
          const onLeave = () => {
            // Settle flat on the playful overshoot curve; fade the sheen out.
            gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'back.out(1.4)' });
            if (sheen) gsap.to(sheen, { opacity: 0, duration: 0.3, ease: 'power2.out' });
          };

          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerleave', onLeave);
          return () => {
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerleave', onLeave);
            gsap.set(el, { clearProps: 'rotationX,rotationY' });
          };
        },
      );

      return () => mm.revert();
    },
    { scope: ref, dependencies: [maxDeg] },
  );

  return (
    <article
      ref={ref}
      tabIndex={0}
      aria-labelledby="tc-title"
      style={{
        position: 'relative',
        display: 'grid',
        gap: 'var(--space-md)',
        maxWidth: '24rem',
        padding: 'var(--space-xl)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        transformStyle: 'preserve-3d',
        perspective: 900,
        willChange: 'transform',
      }}
    >
      {/* opacity-only specular sheen — fixed radial layer, only opacity tweens */}
      <span
        data-sheen
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: 0,
          background:
            'radial-gradient(40% 45% at var(--gx,50%) var(--gy,50%), #ffffff80, #ffffff00 70%)',
        }}
      />
      {eyebrow ? (
        <p
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
      <h2
        id="tc-title"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--size-h4)',
          lineHeight: 'var(--lh-tight)',
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      {children ? <div style={{ color: 'var(--fg-dim)' }}>{children}</div> : null}
    </article>
  );
}
