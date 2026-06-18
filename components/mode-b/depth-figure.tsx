'use client';

/**
 * DepthFigure — a foreground image card held in depth.
 *
 * Two motions, layered:
 *   1. Scroll parallax — the image drifts within its card as the card crosses
 *      the viewport (transform-only, scrubbed by ScrollTrigger).
 *   2. Pointer tilt — a gentle rotateX/rotateY toward the cursor, settling with
 *      a playful overshoot on leave.
 *
 * The tilt is gated to `(hover:hover) and (pointer:fine)` and disabled under
 * reduced motion, so it never fires on touch (taste-guardrails §1.9). Both
 * motions degrade to a still, composed card — the <img> always carries `alt`
 * and a soft token shadow. All visuals reference the same CSS token vars as
 * Mode A (design.md / tokens/build/variables.css).
 */

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export type DepthFigureProps = {
  /** Image source. */
  src: string;
  /** Required alt text — describe the subject, not "image of". */
  alt: string;
  /** Optional caption rendered under the card. */
  caption?: React.ReactNode;
  /** Max tilt in degrees toward the cursor (default 8). */
  maxTilt?: number;
  /** Peak parallax drift of the image inside its card, in px (default 18). */
  parallax?: number;
  /** Intrinsic pixel dimensions for layout stability. */
  width?: number;
  height?: number;
  className?: string;
};

export function DepthFigure({
  src,
  alt,
  caption,
  maxTilt = 8,
  parallax = 18,
  width = 1000,
  height = 1250,
  className,
}: DepthFigureProps) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      // gsap.matchMedia keeps each branch scoped and auto-reverts on resize.
      const mm = gsap.matchMedia();

      // Motion branch: entrance + parallax. Excludes reduced-motion.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(root.current, {
          y: 40,
          autoAlpha: 0,
          duration: 0.72,
          ease: 'power3.out', // mirrors --ease-reveal cubic-bezier(.16,1,.3,1)
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
        });

        gsap.fromTo(
          img.current,
          { yPercent: parallax / -2 },
          {
            yPercent: parallax / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      // Tilt branch: ONLY a precise pointer that can hover, and only with motion
      // allowed — so touch devices never get 3D rotation (guardrails §1.9).
      mm.add(
        '(hover:hover) and (pointer:fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const el = root.current!;
          // Track toward the cursor with a decel ease...
          const setX = gsap.quickTo(card.current, 'rotationY', { duration: 0.3, ease: 'power3.out' });
          const setY = gsap.quickTo(card.current, 'rotationX', { duration: 0.3, ease: 'power3.out' });

          const onMove = (ev: PointerEvent) => {
            const r = el.getBoundingClientRect();
            const dx = (ev.clientX - r.left) / r.width - 0.5; // -0.5..0.5
            const dy = (ev.clientY - r.top) / r.height - 0.5;
            setX(dx * maxTilt);
            setY(dy * -maxTilt);
          };
          // ...and settle home with a playful overshoot (--ease-playful).
          const onLeave = () => {
            gsap.to(card.current, {
              rotationX: 0,
              rotationY: 0,
              duration: 0.5,
              ease: 'back.out(1.6)', // mirrors --ease-playful cubic-bezier(.34,1.56,.64,1)
            });
          };

          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerleave', onLeave);
          return () => {
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerleave', onLeave);
          };
        },
      );
    },
    { scope: root, dependencies: [maxTilt, parallax] },
  );

  return (
    <div
      ref={root}
      className={className}
      style={{ perspective: '900px', width: 'min(78vw, 28rem)' }}
    >
      <div
        ref={card}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-soft, 0 24px 60px -28px #16131066)',
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <img
          ref={img}
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            aspectRatio: '4 / 5',
            objectFit: 'cover',
          }}
        />
      </div>
      {caption ? (
        <p
          style={{
            marginTop: 'var(--space-md)',
            fontSize: 'var(--size-body-lg)',
            color: 'var(--fg-dim)',
            maxWidth: '34ch',
            textAlign: 'center',
          }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
