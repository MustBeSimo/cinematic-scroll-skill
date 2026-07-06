#!/usr/bin/env node
/* score.mjs — CinematicBench pure rubric. Deterministic: measurements in → 0-100 out.
   No I/O, no network, no LLM. Deduction-based, mirroring doctor/audit conventions.
   Any change to deductions bumps BENCH_VERSION and requires re-benching the corpus. */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const BENCH_VERSION = "1.1";
const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));

const REQUIRED = [
  "fps.avg", "fps.droppedPct", "scroll.docHeight", "scroll.viewportHeight", "scroll.sections",
  "scroll.pinnedRanges", "scroll.scrollJack", "motion.changedNodes", "motion.animatedNodes",
  "motion.transformOpacityOnly", "motion.parallaxLayers", "motion.entranceStagger",
  "stability.clsProxy", "a11y.reducedMotionHonored", "a11y.focusVisible",
  "a11y.contrastFailures", "a11y.motionToggle", "console.errors", "console.failedRequests",
];
const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);

export function validateMeasurements(m) {
  const e = [];
  for (const p of REQUIRED) if (get(m, p) === undefined) e.push(`missing field: ${p}`);
  return e;
}

export function scoreMeasurements(m) {
  const errs = validateMeasurements(m);
  if (errs.length) throw new Error("invalid measurements: " + errs.join("; "));
  const anyMotion = m.motion.changedNodes > 0 || m.motion.animatedNodes > 0;
  const longPage = m.scroll.docHeight > 3 * m.scroll.viewportHeight;
  const veryLongPage = m.scroll.docHeight > 5 * m.scroll.viewportHeight;

  // Pacing (25%)
  let pacing = 100;
  if (m.scroll.scrollJack) pacing -= 40;
  if (!anyMotion) pacing -= 30;                                   // static page
  if (m.scroll.sections === 0 && longPage) pacing -= 25;          // no sectioning on a long page
  if (m.motion.changedRatio !== undefined && m.motion.changedRatio > 0.8) pacing -= 20; // wall-to-wall motion
  if (m.scroll.pinnedRanges === 0 && veryLongPage && anyMotion) pacing -= 10;
  pacing = clamp(pacing);

  // Performance (30%): fps band 18→58 maps 0→100, minus jank + runtime noise
  let performance = ((m.fps.avg - 18) / 40) * 100;
  performance = clamp(performance);
  performance -= Math.min(30, m.fps.droppedPct);
  performance -= Math.min(20, m.console.errors * 5 + m.console.failedRequests * 2);
  performance = clamp(performance);

  // Accessibility (25%)
  let a11y = 100;
  const reducedOk = m.a11y.reducedMotionHonored || !anyMotion;    // no motion ⇒ trivially honored
  if (!reducedOk) a11y -= 40;
  if (!m.a11y.focusVisible) a11y -= 20;
  a11y -= Math.min(30, m.a11y.contrastFailures * 2);
  if (anyMotion && !reducedOk && !m.a11y.motionToggle) a11y -= 10;
  a11y = clamp(a11y);

  // Motion Craft (20%)
  let motionCraft = 100;
  if (m.motion.changedNodes === 0) motionCraft -= 30;             // no scroll choreography
  if (m.motion.transformOpacityOnly < 0.7) motionCraft -= 25;
  else if (m.motion.transformOpacityOnly < 0.9) motionCraft -= 10;
  if (m.motion.parallaxLayers === 0) motionCraft -= 15;
  if (!m.motion.entranceStagger) motionCraft -= 10;
  if (m.stability.clsProxy > 0.1) motionCraft -= 25;
  else if (m.stability.clsProxy > 0.05) motionCraft -= 10;
  motionCraft = clamp(motionCraft);

  const overall = clamp(0.25 * pacing + 0.30 * performance + 0.25 * a11y + 0.20 * motionCraft);
  return { pacing, performance, a11y, motionCraft, overall };
}

// ---------- selftest fixtures ----------
const BASE = {
  fps: { avg: 60, droppedPct: 0 },
  scroll: { docHeight: 9000, viewportHeight: 900, sections: 8, pinnedRanges: 2, scrollJack: false },
  motion: { changedNodes: 40, animatedNodes: 35, changedRatio: 0.3, transformOpacityOnly: 0.95, parallaxLayers: 3, entranceStagger: true },
  stability: { clsProxy: 0.02 },
  a11y: { reducedMotionHonored: true, focusVisible: true, contrastFailures: 1, motionToggle: false },
  console: { errors: 0, failedRequests: 0 },
};
const withPatch = (patch) => JSON.parse(JSON.stringify(Object.assign({}, BASE, patch, {
  fps: { ...BASE.fps, ...(patch.fps || {}) }, scroll: { ...BASE.scroll, ...(patch.scroll || {}) },
  motion: { ...BASE.motion, ...(patch.motion || {}) }, stability: { ...BASE.stability, ...(patch.stability || {}) },
  a11y: { ...BASE.a11y, ...(patch.a11y || {}) }, console: { ...BASE.console, ...(patch.console || {}) },
})));

function selftest() {
  const ok = (c, msg) => { if (!c) { console.error("✗ score selftest: " + msg); process.exit(1); } };
  // GREAT: fps 59/2% → perf 98; a11y 98 (1 contrast); pacing 100; craft 100 → overall 99
  const great = scoreMeasurements(withPatch({ fps: { avg: 59, droppedPct: 2 } }));
  ok(great.pacing === 100 && great.performance === 98 && great.a11y === 98 && great.motionCraft === 100 && great.overall === 99,
    `great expected 100/98/98/100/99, got ${JSON.stringify(great)}`);
  // STATIC: no motion → pacing 70, craft 45; perf 100; a11y 100 → overall 82
  const stat = scoreMeasurements(withPatch({
    scroll: { docHeight: 2000, sections: 2, pinnedRanges: 0 },
    motion: { changedNodes: 0, animatedNodes: 0, changedRatio: 0, transformOpacityOnly: 1, parallaxLayers: 0, entranceStagger: false },
    stability: { clsProxy: 0 }, a11y: { contrastFailures: 0 },
  }));
  ok(stat.pacing === 70 && stat.motionCraft === 45 && stat.performance === 100 && stat.a11y === 100 && stat.overall === 82,
    `static expected 70/100/100/45/82, got ${JSON.stringify(stat)}`);
  // JANKY: fps 24, 45% dropped, 3 errors + 2 failed → perf 0; scrollJack → pacing 60
  const janky = scoreMeasurements(withPatch({ fps: { avg: 24, droppedPct: 45 }, scroll: { scrollJack: true }, console: { errors: 3, failedRequests: 2 } }));
  ok(janky.performance === 0 && janky.pacing === 60, `janky expected perf 0 pacing 60, got ${JSON.stringify(janky)}`);
  // HOSTILE MOTION: reduced-motion ignored, no focus, 20 contrast fails, no toggle → a11y 0
  const hostile = scoreMeasurements(withPatch({ a11y: { reducedMotionHonored: false, focusVisible: false, contrastFailures: 20, motionToggle: false } }));
  ok(hostile.a11y === 0, `hostile expected a11y 0, got ${hostile.a11y}`);
  // monotonicity: worse fps never raises performance
  ok(scoreMeasurements(withPatch({ fps: { avg: 40, droppedPct: 10 } })).performance <
     scoreMeasurements(withPatch({ fps: { avg: 58, droppedPct: 0 } })).performance, "monotonicity: fps");
  // validation
  let threw = false; try { scoreMeasurements({}); } catch { threw = true; }
  ok(threw, "invalid measurements must throw");
  ok(validateMeasurements({}).length > 0 && validateMeasurements(BASE).length === 0, "validateMeasurements");
  console.log("✓ score selftest: great 99 / static 82 / janky perf 0 / hostile a11y 0, monotonic, validated.");
  process.exit(0);
}

// realpath-resolved: npm's node_modules/.bin/ symlinks (how npx always invokes bins) and
// macOS's /tmp -> /private/tmp both break a raw argv[1]-vs-import.meta.url comparison.
let isMain = false;
try { isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]); } catch { isMain = false; }
if (isMain) { if (process.argv.includes("--selftest")) selftest(); else { console.error("score.mjs is a library; run --selftest."); process.exit(2); } }
