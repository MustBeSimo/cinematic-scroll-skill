'use client';

/**
 * HTML overlay for the flagship — copy, Enter-XR affordances, AR quick-look.
 *
 * Lives OUTSIDE the Canvas (`webxr.md` §3). The 2D page is complete on its own:
 * every chapter's title/lede/CTA reads with zero WebGL. Enter-XR buttons are
 * GATED on `useXRSupport()` — unsupported devices simply never see them (no dead
 * buttons, `webxr.md` §1). Under reduced motion, immersive XR is not offered;
 * AR quick-look (self-paced, static) still is.
 *
 * The scroll height here matches the Canvas's drei <ScrollControls pages={N}>:
 * one full viewport per chapter, so the HTML rail and the GL camera advance in
 * lockstep ("one choreography, two media").
 */

import { useState } from 'react';
import { flagshipChapters, assetManifest, type FlagshipChapter } from '@/lib/flagship-manifest';
import { useXRSupport } from '@/lib/use-xr-support';
import { useEnterXR } from '@/lib/flagship-xr';
import { ModelViewer } from './ModelViewer';

export type FlagshipOverlayProps = {
  /** Immersive XR is suppressed when reduced motion is preferred. */
  reducedMotion: boolean;
};

export function FlagshipOverlay({ reducedMotion }: FlagshipOverlayProps) {
  const support = useXRSupport();
  const { presenting, enterVR, enterAR, exit } = useEnterXR();

  return (
    <div className="pointer-events-none relative z-10">
      {/* Global Exit affordance — always reachable while presenting (`webxr.md` §5). */}
      {presenting ? (
        <button
          type="button"
          onClick={exit}
          className="pointer-events-auto fixed left-1/2 top-[max(env(safe-area-inset-top),1rem)] z-30 -translate-x-1/2 rounded-full border border-white/30 bg-black/60 px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-white backdrop-blur"
        >
          Exit XR
        </button>
      ) : null}

      {flagshipChapters.map((chapter) => (
        <ChapterPanel
          key={chapter.id}
          chapter={chapter}
          reducedMotion={reducedMotion}
          xr={{
            vr: support.vr && !reducedMotion,
            ar: support.ar && !reducedMotion,
            ready: support.ready,
          }}
          onEnterVR={enterVR}
          onEnterAR={enterAR}
        />
      ))}
    </div>
  );
}

function ChapterPanel({
  chapter,
  reducedMotion,
  xr,
  onEnterVR,
  onEnterAR,
}: {
  chapter: FlagshipChapter;
  reducedMotion: boolean;
  xr: { vr: boolean; ar: boolean; ready: boolean };
  onEnterVR: () => void;
  onEnterAR: () => void;
}) {
  const asset = assetManifest[chapter.id];
  const showEnterVR = xr.ready && chapter.vr && xr.vr;
  // AR: prefer immersive-ar button when supported; the model-viewer quick-look
  // (below) is the phone fallback and is shown when a real model + usdz exist.
  const showEnterAR = xr.ready && chapter.ar && xr.ar;
  const showQuickLook = chapter.ar && asset.runtime !== 'procedural' && asset.iosAr != null;

  return (
    <section
      id={`flagship-${chapter.id}`}
      className="relative flex min-h-[200vh] items-center"
      style={{ background: chapter.morph }}
      aria-label={`${chapter.eyebrow}: ${chapter.title.map((t) => t.line).join(' ')}`}
    >
      <div className="pointer-events-none w-full px-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <p className="mb-4 font-mono text-fluid-eyebrow uppercase tracking-[0.32em] text-white/70">
            {chapter.eyebrow}
          </p>
          <h2 className="text-balance font-black leading-[0.9] tracking-[-0.04em] text-fluid-headline">
            {chapter.title.map((t, i) => (
              <span
                key={i}
                className="block"
                style={t.accent ? { color: chapter.accent } : undefined}
              >
                {t.line}
              </span>
            ))}
          </h2>
          <p className="mt-6 max-w-xl text-balance text-fluid-body leading-relaxed text-white/80">
            {chapter.lede}
          </p>

          {/* Actions — pointer-events re-enabled only on the interactive row. */}
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
            {showEnterVR ? (
              <XRButton accent={chapter.accent} onClick={onEnterVR}>
                Enter VR
              </XRButton>
            ) : null}
            {showEnterAR ? (
              <XRButton accent={chapter.accent} onClick={onEnterAR}>
                View in AR
              </XRButton>
            ) : null}
            {chapter.cta ? (
              <a
                href={chapter.cta.href}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-white/90 transition-colors hover:bg-white/10"
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: chapter.accent }} />
                {chapter.cta.label}
              </a>
            ) : null}
          </div>

          {/* Phone AR quick-look — only when a real model + usdz are present. */}
          {showQuickLook ? (
            <div className="pointer-events-auto mt-8 h-[42vh] max-h-[360px] w-full max-w-md overflow-hidden rounded-lg border border-white/15 bg-black/30">
              <ModelViewer
                src={asset.runtime}
                iosSrc={asset.iosAr}
                poster={asset.fallbackPoster}
                alt={`${chapter.title.map((t) => t.line).join(' ')}, viewable in augmented reality`}
              />
            </div>
          ) : null}

          {reducedMotion ? (
            <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
              Reduced motion — held as a still frame
            </p>
          ) : null}
        </div>
      </div>

      {/* Oversized movement number watermark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[6vh] right-[4vw] select-none font-mono text-[clamp(6rem,16vw,14rem)] font-black leading-none text-white/[0.05]"
      >
        {chapter.roman}
      </div>
    </section>
  );
}

function XRButton({
  children,
  accent,
  onClick,
}: {
  children: React.ReactNode;
  accent: string;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-black transition-transform"
      style={{
        background: accent,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        boxShadow: `0 0 28px ${accent}55`,
      }}
    >
      {children}
    </button>
  );
}
