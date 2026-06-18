'use client';

/**
 * ScrubVideo — a <video> whose currentTime is driven by scroll progress.
 *
 * Desktop: pin the stage (sticky), map track scroll → currentTime, seek on
 * requestVideoFrameCallback (frame-accurate) with a rAF fallback.
 * Touch / iOS: Safari blocks off-gesture currentTime seeks, so we degrade to
 * the poster still. For a true scrubbed look on touch, swap the <video> for a
 * canvas image-sequence (preloaded /frames/NNNN.webp + drawImage on rAF).
 *
 * Token-driven (tokens/build/variables.css), transform/opacity only, and
 * reduced-motion / touch safe via gsap.matchMedia.
 */

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export interface ScrubVideoProps {
  /** Scrubbed clip (muted, playsInline). Hidden on touch — the poster carries it. */
  src: string;
  /** Poster still: the stable fallback on touch/iOS and before the video paints. */
  poster: string;
  /** Drives both the video aria-label and the poster alt — required for a11y. */
  label: string;
  eyebrow?: string;
  title?: string;
  /** Track height as a multiple of the viewport — longer = slower scrub. Default 3.2. */
  trackVh?: number;
}

export default function ScrubVideo({
  src,
  poster,
  label,
  eyebrow = 'Movement 03',
  title = 'Scroll drives the frame.',
  trackVh = 3.2,
}: ScrubVideoProps) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop, fine pointer, motion allowed → scrub. Everything else stays on the poster.
      mm.add(
        '(hover:hover) and (pointer:fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const v = video.current;
          const track = root.current;
          if (!v || !track) return;

          let duration = v.duration || 0;
          let target = 0;
          let ticking = false;
          const useRVFC = 'requestVideoFrameCallback' in v;

          const onMeta = () => {
            duration = v.duration || 0;
            track.dataset.ready = ''; // cross-fades the poster out via CSS
          };
          v.addEventListener('loadedmetadata', onMeta);
          if (v.readyState >= 1) onMeta();

          // scroll progress 0→1 across the track; rAF/rVFC-throttled, never seek in the handler (§1.8)
          const progress = () => {
            const r = track.getBoundingClientRect();
            const span = r.height - window.innerHeight;
            return span <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / span));
          };
          const seek = () => {
            ticking = false;
            if (duration) v.currentTime = target * duration;
          };
          const onScroll = () => {
            target = progress();
            if (ticking) return;
            ticking = true;
            useRVFC ? v.requestVideoFrameCallback(seek) : requestAnimationFrame(seek);
          };

          window.addEventListener('scroll', onScroll, { passive: true });
          onScroll();
          return () => {
            window.removeEventListener('scroll', onScroll);
            v.removeEventListener('loadedmetadata', onMeta);
          };
        },
      );

      // Caption rise — once, transform/opacity only, reveal curve. Skipped under reduced-motion.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.sv-reveal', {
          y: 40,
          autoAlpha: 0,
          duration: 0.72,
          ease: 'power3.out', // --ease-reveal
          stagger: 0.09,
          scrollTrigger: { trigger: root.current, start: 'top 60%' },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="sv-track"
      aria-labelledby="sv-title"
      style={{ position: 'relative', height: `${trackVh * 100}vh` }}
    >
      <div className="sv-stage">
        {/* poster still — fallback on touch/iOS and before the video can paint */}
        <img className="sv-frame sv-poster" src={poster} alt={label} />
        {/* scrubbed video — muted + playsInline + poster + aria-label; never autoplays */}
        <video
          ref={video}
          className="sv-frame sv-video"
          poster={poster}
          muted
          playsInline
          preload="auto"
          aria-label={label}
        >
          <source src={src} type="video/mp4" />
        </video>
        <div className="sv-caption">
          <p className="sv-eyebrow sv-reveal">{eyebrow}</p>
          <h2 className="sv-title sv-reveal" id="sv-title">
            {title}
          </h2>
        </div>
      </div>

      {/* Co-located token CSS — transform/opacity only, touch degrade, reduced-motion safe. */}
      <style>{`
        .sv-stage{position:sticky;top:0;height:100vh;display:grid;place-items:center;overflow:clip;background:var(--surface)}
        .sv-frame{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .sv-poster{opacity:1;transition:opacity var(--dur-slow) var(--ease-exit)}
        .sv-track[data-ready] .sv-poster{opacity:0}
        .sv-caption{position:relative;z-index:1;max-width:42rem;padding:var(--space-lg);text-align:center;
          color:var(--bg);text-shadow:0 1px 24px #16131066}
        .sv-eyebrow{font-family:var(--font-ui);font-size:var(--size-caption);letter-spacing:.22em;
          text-transform:uppercase;opacity:.86}
        .sv-title{font-family:var(--font-display);font-size:var(--fluid-h1);line-height:var(--lh-tight);
          font-weight:600;margin-top:var(--space-md)}
        .sv-track :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
        @media (max-width:768px){ .sv-title{font-size:2rem} }
        @media (hover:none) and (pointer:coarse){
          .sv-track{height:auto !important}
          .sv-stage{position:static;height:auto;aspect-ratio:16/9}
          .sv-video{display:none}            /* poster carries the visual on touch */
        }
        @media (prefers-reduced-motion: reduce){
          .sv-poster{transition:none}
        }
      `}</style>
    </section>
  );
}
