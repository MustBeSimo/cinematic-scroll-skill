'use client';

/**
 * Client boundary + graceful-degradation gate for the flagship (Mode B).
 *
 * Decides, on the client, which path to render (`references/3d-stack.md` §4):
 *   • no WebGL            → static poster fallback (never construct a renderer)
 *   • prefers-reduced-motion → scene mounts but holds ONE composed still frame
 *   • mobile / coarse pointer → lighter scene (lower dpr, no shadows/post)
 *   • otherwise            → the full animated R3F scene
 *
 * The Canvas is lazy-loaded (`next/dynamic`, ssr:false) so three/R3F never run
 * on the server and the WebGL bundle is only fetched when WebGL is present.
 * Until it resolves, a Suspense fallback shows the poster — no blank box, ever.
 */

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useIsMobile } from '@/lib/use-device';
import { flagshipChapters, assetManifest } from '@/lib/flagship-manifest';

// Lazy, client-only — keeps three/R3F out of the SSR bundle and the no-WebGL path.
const FlagshipScene = dynamic(
  () => import('./FlagshipScene').then((m) => m.FlagshipScene),
  { ssr: false, loading: () => <PosterFallback /> },
);

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export function FlagshipRoot() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'pending' | 'webgl' | 'fallback'>('pending');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // Reduced-motion (live — respond if the user toggles it).
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);

    // WebGL feature-detection BEFORE any renderer is constructed (`3d-stack.md` §4).
    setStatus(hasWebGL() ? 'webgl' : 'fallback');

    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#05060b] text-white">
      {status === 'fallback' ? (
        <PosterFallback />
      ) : status === 'webgl' ? (
        <Suspense fallback={<PosterFallback />}>
          {/* `animate=false` under reduced motion → one still frame, no loop. */}
          <FlagshipScene animate={!reduced} mobile={isMobile} />
        </Suspense>
      ) : (
        // pending — show the poster until detection resolves (no blank flash).
        <PosterFallback />
      )}
    </main>
  );
}

/**
 * Static fallback (`3d-stack.md` §4) — shown when WebGL is absent, during load,
 * and as the permanent floor the experience never drops below. Pure CSS/HTML:
 * the four movements still read as a legible page with zero WebGL. Falls back to
 * a CSS gradient when a chapter's poster image is not present.
 */
function PosterFallback() {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      {flagshipChapters.map((chapter) => (
        <section
          key={chapter.id}
          className="relative flex min-h-screen items-center"
          style={{
            background: `${chapter.morph}, radial-gradient(120% 120% at 50% 0%, #0a1228, #05060b 70%)`,
          }}
        >
          {/* Poster image behind the copy — degrades to the gradient if missing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetManifest[chapter.id].fallbackPoster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="relative w-full px-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] md:px-16 lg:px-24">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-fluid-eyebrow uppercase tracking-[0.32em] text-white/70">
                {chapter.eyebrow}
              </p>
              <h2 className="text-balance font-black leading-[0.9] tracking-[-0.04em] text-fluid-headline">
                {chapter.title.map((t, i) => (
                  <span key={i} className="block" style={t.accent ? { color: chapter.accent } : undefined}>
                    {t.line}
                  </span>
                ))}
              </h2>
              <p className="mt-6 max-w-xl text-balance text-fluid-body leading-relaxed text-white/80">
                {chapter.lede}
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
