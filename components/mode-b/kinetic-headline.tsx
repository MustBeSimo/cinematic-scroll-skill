'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * KineticHeadline — split-line-rise heading (taste-guardrails §4.5).
 *
 * The text splits into per-word spans nested in line-masks; words rise + fade in
 * on a staggered cascade when the heading enters view. Accessibility: the <h2>
 * carries `aria-label={text}` (announced once) and the word spans are aria-hidden,
 * so AT never reads it word-by-word. Reduced motion → plain, fully-visible heading.
 *
 * Motion budget: transform (`yPercent`) + opacity ONLY (§1.6). gsap.matchMedia
 * gates the animation so reduced-motion users get a static heading with no tween.
 *
 * Pass `lines` as an array of arrays of words to control where each visual line
 * breaks (and where the line-mask clips). `accentFrom` color-tints trailing words.
 */
export interface KineticHeadlineProps {
  /** The full, readable sentence — used verbatim as the heading's aria-label. */
  text: string;
  /** Visual lines, each an array of word strings. Drives line-masks + wrapping. */
  lines: string[][];
  /** Index into the flat word list from which words take the accent color. */
  accentFrom?: number;
  /** Eyebrow / kicker above the headline. */
  eyebrow?: string;
  /** Heading level tag. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function KineticHeadline({
  text,
  lines,
  accentFrom = Infinity,
  eyebrow,
  as: Tag = 'h2',
  className,
}: KineticHeadlineProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Animate only when motion is allowed; reduced-motion gets the static default.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const words = gsap.utils.toArray<HTMLElement>('.kh-word', root.current);
        gsap.set(words, { yPercent: 110, opacity: 0 });

        gsap.to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.72,
          ease: 'expo.out', // mirrors --ease-reveal cubic-bezier(.16,1,.3,1)
          stagger: 0.07, // §3.6 — keep the wave under ~5 perceptual steps
          scrollTrigger: {
            trigger: root.current,
            start: 'top 65%',
            once: true,
          },
        });

        // cleanup: matchMedia revert restores the cascade on resize/RM toggle
        return () => gsap.set(words, { clearProps: 'transform,opacity' });
      });
    },
    { scope: root }
  );

  let wordIndex = -1;

  return (
    <section ref={root} className={className} aria-labelledby="kh-title">
      {eyebrow && <p className="kh-eyebrow">{eyebrow}</p>}
      <Tag className="kh-title" id="kh-title" aria-label={text}>
        {lines.map((line, li) => (
          // each line is its own overflow:hidden mask so words rise from below it
          <span className="kh-line" key={li} aria-hidden="true">
            {line.map((word) => {
              wordIndex += 1;
              const accent = wordIndex >= accentFrom;
              return (
                <span
                  className={`kh-word${accent ? ' kh-accent' : ''}`}
                  key={`${li}-${word}`}
                >
                  {word}
                </span>
              );
            })}
          </span>
        ))}
      </Tag>
    </section>
  );
}

/*
  Companion CSS (token-driven — pairs with the Mode A :root). The word::after
  rule restores inter-word spacing; .kh-line clips so descenders ride the mask.

  .kh-title{font-family:var(--font-display);font-size:var(--fluid-h1);
    line-height:var(--lh-tight);font-weight:600;max-width:18ch;text-wrap:balance}
  .kh-line{display:block;overflow:hidden;padding-bottom:.04em}
  .kh-word{display:inline-block;will-change:transform}
  .kh-word::after{content:"\00a0"}
  .kh-accent{color:var(--accent)}
  .kh-eyebrow{font-family:var(--font-ui);font-size:var(--size-caption);
    letter-spacing:.22em;text-transform:uppercase;color:var(--fg-dim)}
  @media (max-width:768px){.kh-title{font-size:2rem;max-width:none}}
  @media (prefers-reduced-motion:reduce){.kh-line{overflow:visible}}
*/

/* Usage:
<KineticHeadline
  eyebrow="Chapter 01"
  text="Every word arrives on its own beat."
  lines={[['Every','word','arrives'],['on','its','own','beat.']]}
  accentFrom={3}
/>
*/
