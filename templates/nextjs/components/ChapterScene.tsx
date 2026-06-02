'use client';

import React from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion as useFMReducedMotion,
  type Variants,
} from 'framer-motion';
import { ScrollChoreography, ScrollLayer } from 'choreo-3d';
import type { EditionChapter } from '@/lib/editions-manifest';
import { useIsMobile } from '@/lib/use-device';
import { ChapterDemoVisual } from './ChapterDemoVisual';

/**
 * 7-layer cinematic chapter scene.
 *
 * Layers (depth multipliers — lower = slower = perceptually farther):
 *   0.15  atmospheric gradient (sky)
 *   0.30  mid-far texture (grid / haze)
 *   0.50  main background image
 *   0.75  foreground figure (chapter.foreground)
 *   1.00  UI: title + summary + glass panel
 *   1.20  oversized Roman-numeral watermark (foreground accent)
 *   1.40  scroll cue / chapter badge (closest overlay)
 *
 * 3D camera: perspective: 1200px on wrapper, scroll-driven rotateX/Y + translateZ
 * on the subject layer (disabled on touch + reduced motion).
 *
 * Title reveal: word stagger via Framer Motion (no plain opacity fade).
 *
 * Mobile (<768px): pinning is disabled, but the chapter is NOT static.
 * Layers stack vertically with (a) a lerped vertical image parallax driven
 * by the section's scroll progress and (b) a declarative `whileInView`
 * entrance reveal that cascades the text column. All motion is transform
 * (`y`) + opacity only — compositor-friendly, no scroll-jacking.
 *
 * NOTE: iOS Safari reports `animation-timeline: view()` as supported but
 * does NOT actually drive native scroll-driven animations, so mobile motion
 * is JS-driven via framer-motion (useScroll/useTransform/useSpring on rAF),
 * which runs reliably on Safari.
 */
function ChapterSceneImpl({ chapter, eager = false }: { chapter: EditionChapter; eager?: boolean }) {
  const isMobile = useIsMobile();
  const reduced = useFMReducedMotion() ?? false;

  if (isMobile || reduced) {
    return <MobileChapter chapter={chapter} eager={eager} />;
  }
  return <DesktopChapter chapter={chapter} eager={eager} />;
}

/**
 * Memoized so the chapter list is not re-rendered when an ancestor's
 * `activeId` state changes (the IntersectionObserver in EditionsPage updates
 * it on every section crossing). `chapter` comes from a static manifest and
 * `eager` is a stable boolean, so the props are referentially stable.
 */
export const ChapterScene = React.memo(ChapterSceneImpl);

// ─── DESKTOP — 7 layers, perspective camera, word-stagger title ────────────

function DesktopChapter({ chapter, eager }: { chapter: EditionChapter; eager: boolean }) {
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ['start end', 'end start'] });

  // 3D camera — gentle pitch + dolly-back across the chapter
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [3, 0, -3]);
  const translateZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, -60]);

  return (
    <section
      id={chapter.id}
      ref={sceneRef}
      className="relative min-h-screen"
      style={{ perspective: '1200px' }}
    >
      <ScrollChoreography pinDistance="160vh" start="top top" scrub={0.9} className="relative h-screen overflow-hidden">
        {/* ── Layer 1 — atmospheric far (depth 0.15) ─────────────────── */}
        <ScrollLayer keyframes={layer1Atmosphere} depth={0.15} zIndex={1} style={{ position: 'absolute', inset: 0 }}>
          <div
            className="absolute inset-0"
            style={{ background: chapter.atmosphere.background }}
            aria-hidden
          />
        </ScrollLayer>

        {/* ── Layer 2 — mid-far texture (depth 0.30) ─────────────────── */}
        <ScrollLayer keyframes={layer2MidFar} depth={0.30} zIndex={2} style={{ position: 'absolute', inset: 0 }}>
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-screen [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:120px_120px]"
            aria-hidden
          />
        </ScrollLayer>

        {/* ── Layer 3 — main background (depth 0.50) ─────────────────── */}
        {/* If chapter.background is set, render the fal.ai-generated image. */}
        {/* If undefined, render the CSS-only ChapterDemoVisual so the page  */}
        {/* looks stunning even without any fal setup. */}
        <ScrollLayer keyframes={layer3Background} depth={0.50} zIndex={3} style={{ position: 'absolute', inset: 0 }}>
          {chapter.background ? (
            <>
              <Image
                src={chapter.background}
                alt=""
                fill
                sizes="100vw"
                priority={eager}
                placeholder={chapter.backgroundBlur ? 'blur' : 'empty'}
                blurDataURL={chapter.backgroundBlur}
                className="object-cover opacity-80 saturate-[0.85]"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.82)_100%)]"
                aria-hidden
              />
            </>
          ) : (
            <ChapterDemoVisual chapter={chapter} eager={eager} />
          )}
        </ScrollLayer>

        {/* ── Layer 4 — subject / foreground figure (depth 0.75) with 3D camera ── */}
        {chapter.foreground ? (
          <ScrollLayer keyframes={layer4Subject} depth={0.75} zIndex={4} style={{ position: 'absolute', inset: 0 }}>
            <motion.div
              style={{ rotateX, translateZ, transformStyle: 'preserve-3d' }}
              className="pointer-events-none absolute right-[8%] top-[14%] hidden w-[28vw] max-w-[420px] md:block"
            >
              <Image
                src={chapter.foreground}
                alt=""
                width={560}
                height={700}
                className="h-auto w-full object-contain drop-shadow-2xl"
              />
            </motion.div>
          </ScrollLayer>
        ) : null}

        {/* ── Layer 5 — UI text + glass panel (depth 1.0) with word stagger ── */}
        <ScrollLayer keyframes={layer5UI} depth={1.0} zIndex={5} style={{ position: 'absolute', inset: 0 }}>
          <div className="grid h-screen grid-cols-1 items-center gap-8 pt-[max(env(safe-area-inset-top),5rem)] pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] md:grid-cols-[1.05fr_0.95fr] md:px-16 lg:px-24">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.32em] text-white/70">
                {chapter.roman} / {chapter.eyebrow}
              </p>
              <WordStaggerTitle text={chapter.title} progress={scrollYProgress} />
              <p className="mt-6 max-w-xl text-balance text-fluid-body leading-relaxed text-white/78">
                {chapter.summary}
              </p>
            </div>
            <GlassPanel accent={chapter.accent} chapter={chapter} />
          </div>
        </ScrollLayer>

        {/* ── Layer 6 — oversized Roman numeral watermark (depth 1.20) ── */}
        <ScrollLayer keyframes={layer6Accent} depth={1.20} zIndex={6} style={{ position: 'absolute', inset: 0 }}>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[6vh] left-[3vw] select-none font-mono text-[clamp(8rem,18vw,16rem)] font-black leading-none text-white/[0.06]"
          >
            {chapter.roman}
          </div>
        </ScrollLayer>

        {/* ── Layer 7 — closest overlay: scroll cue / chapter badge (depth 1.40) ── */}
        <ScrollLayer keyframes={layer7Closest} depth={1.40} zIndex={7} style={{ position: 'absolute', inset: 0 }}>
          <div
            className="pointer-events-none absolute right-[max(env(safe-area-inset-right),1.5rem)] top-[max(env(safe-area-inset-top),5rem)] flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/55"
            style={{ color: chapter.accent }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: chapter.accent }} />
            chapter {chapter.roman}
          </div>
        </ScrollLayer>
      </ScrollChoreography>
    </section>
  );
}

// ─── MOBILE — stacked card with lerped parallax + whileInView reveal ───────
// iOS Safari reports `animation-timeline` support but doesn't drive native
// scroll-driven animations, so all motion here is JS-driven via framer-motion.

function MobileChapter({ chapter, eager }: { chapter: EditionChapter; eager: boolean }) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useFMReducedMotion() ?? false;

  // Lerped vertical image parallax — drifts as the section crosses the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yRaw = useTransform(scrollYProgress, [0, 1], reduced ? ['0px', '0px'] : ['-22px', '22px']);
  const imgY = useSpring(yRaw, { stiffness: 120, damping: 30, mass: 0.4 }); // damped = smooth on iOS

  // Declarative entrance reveal — parent fades in + cascades children.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };
  // Reduced motion / static path: drop variants entirely so content renders
  // in its natural (fully visible) DOM state with zero animation.
  const itemVariants = reduced ? undefined : item;

  return (
    <section
      id={chapter.id}
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden"
      style={{ background: chapter.atmosphere.background }}
    >
      <div className="relative h-[55vh] w-full overflow-hidden">
        {/* Oversized wrapper so the parallax drift never exposes edges. */}
        <motion.div className="absolute inset-[-7%_0]" style={{ y: imgY }}>
          {chapter.background ? (
            <Image
              src={chapter.background}
              alt=""
              fill
              sizes="100vw"
              priority={eager}
              placeholder={chapter.backgroundBlur ? 'blur' : 'empty'}
              blurDataURL={chapter.backgroundBlur}
              className="object-cover opacity-90 saturate-[0.85]"
            />
          ) : (
            <ChapterDemoVisual chapter={chapter} eager={eager} />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-3 font-mono text-7xl font-black text-white/15"
        >
          {chapter.roman}
        </div>
      </div>

      <motion.div
        className="relative -mt-12 px-[max(env(safe-area-inset-left),1.25rem)] pr-[max(env(safe-area-inset-right),1.25rem)] pb-12"
        variants={reduced ? undefined : container}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'show'}
        viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      >
        <motion.p
          variants={itemVariants}
          className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/70"
        >
          {chapter.roman} · {chapter.eyebrow}
        </motion.p>
        <motion.h2
          variants={itemVariants}
          className="text-balance text-fluid-display font-black leading-[0.92] tracking-[-0.04em]"
        >
          {chapter.title}
        </motion.h2>
        <motion.p variants={itemVariants} className="mt-4 text-fluid-body leading-relaxed text-white/80">
          {chapter.summary}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-6 rounded-md border border-white/15 bg-black/35 p-5"
          style={{ boxShadow: `inset 0 1px 0 ${chapter.accent}33` }}
        >
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/55">Technical claim</p>
          <p className="mt-2 text-xl font-semibold leading-snug">{chapter.technicalDetail}</p>
          <ul className="mt-5 grid gap-3">
            {chapter.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center justify-between border-t border-white/10 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/75"
              >
                <span>{feature}</span>
                <span style={{ color: chapter.accent }}>active</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Word-stagger title ────────────────────────────────────────────────────

function WordStaggerTitle({
  text,
  progress,
}: {
  text: string;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const words = text.split(' ');
  return (
    <h1 className="max-w-5xl text-balance font-black leading-[0.88] tracking-[-0.045em] text-fluid-display">
      {words.map((word, i) => {
        const start = 0.05 + i * 0.035;
        const end = start + 0.18;
        return <Word key={`${word}-${i}`} word={word} start={start} end={end} progress={progress} />;
      })}
    </h1>
  );
}

function Word({
  word,
  start,
  end,
  progress,
}: {
  word: string;
  start: number;
  end: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], ['0.6em', '0em']);
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <motion.span style={{ display: 'inline-block', opacity, y }}>
        {word}
        &nbsp;
      </motion.span>
    </span>
  );
}

// ─── Glass panel (UI side card) ────────────────────────────────────────────

function GlassPanel({ accent, chapter }: { accent: string; chapter: EditionChapter }) {
  // GlassPanel is only rendered in DesktopChapter, so use the desktop blur directly.
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[560px] overflow-hidden border border-white/20 bg-black/30 p-6 shadow-2xl backdrop-blur-xl md:p-8"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 80% 0%, ${accent}55, transparent 38%)` }}
      />
      <div className="relative">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/55">Technical claim</p>
        <p className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">{chapter.technicalDetail}</p>
        <div className="mt-7 grid gap-2">
          {chapter.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center justify-between border-t border-white/15 py-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-white/70"
            >
              <span>{feature}</span>
              <span style={{ color: accent }}>active</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Keyframe library — depths align with the documented depth chart ──────

const layer1Atmosphere = [
  { at: 0, y: '-2%', scale: 1.04, opacity: 0.95 },
  { at: 0.5, y: '0%', scale: 1.02, opacity: 1 },
  { at: 1, y: '2%', scale: 1.04, opacity: 0.95 },
];

const layer2MidFar = [
  { at: 0, y: '-4%', scale: 1.05, opacity: 0.85 },
  { at: 0.5, y: '0%', scale: 1.02, opacity: 1 },
  { at: 1, y: '4%', scale: 1.05, opacity: 0.85 },
];

const layer3Background = [
  { at: 0, y: '-6%', scale: 1.08, opacity: 0.9 },
  { at: 0.5, y: '0%', scale: 1.02, opacity: 1 },
  { at: 1, y: '6%', scale: 1.08, opacity: 0.9 },
];

const layer4Subject = [
  { at: 0, y: '10%', scale: 0.96, opacity: 0 },
  { at: 0.22, y: '0%', scale: 1, opacity: 1 },
  { at: 0.78, y: '0%', scale: 1, opacity: 1 },
  { at: 1, y: '-8%', scale: 0.98, opacity: 0 },
];

const layer5UI = [
  { at: 0, y: '14%', scale: 0.96, opacity: 0 },
  { at: 0.25, y: '0%', scale: 1, opacity: 1 },
  { at: 0.78, y: '0%', scale: 1, opacity: 1 },
  { at: 1, y: '-10%', scale: 0.98, opacity: 0 },
];

const layer6Accent = [
  { at: 0, y: '20%', scale: 0.94, opacity: 0 },
  { at: 0.32, y: '0%', scale: 1, opacity: 1 },
  { at: 0.7, y: '0%', scale: 1, opacity: 1 },
  { at: 1, y: '-12%', scale: 0.98, opacity: 0 },
];

const layer7Closest = [
  { at: 0, y: '-4%', opacity: 0 },
  { at: 0.2, y: '0%', opacity: 1 },
  { at: 0.85, y: '0%', opacity: 1 },
  { at: 1, y: '-4%', opacity: 0 },
];
