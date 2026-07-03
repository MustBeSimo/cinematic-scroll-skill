#!/usr/bin/env node
/* cli.mjs — CinematicBench runner: robots-respecting capture ×N → median → deterministic score.
   Exit 0 = scored (a report, not a gate) · 1 = could not score · 2 = usage error. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { capture } from "./capture.mjs";
import { scoreMeasurements, BENCH_VERSION } from "./score.mjs";

const NUM_PATHS = ["fps.avg", "fps.droppedPct", "fps.samples", "scroll.docHeight", "scroll.viewportHeight",
  "scroll.sections", "scroll.pinnedRanges", "motion.changedNodes", "motion.animatedNodes", "motion.changedRatio",
  "motion.transformOpacityOnly", "motion.parallaxLayers", "stability.clsProxy", "a11y.contrastFailures",
  "console.errors", "console.failedRequests"];
const BOOL_PATHS = ["scroll.scrollJack", "motion.entranceStagger", "a11y.reducedMotionHonored", "a11y.focusVisible", "a11y.motionToggle"];
const get = (o, p) => p.split(".").reduce((a, k) => a && a[k] !== undefined ? a[k] : undefined, o);
const set = (o, p, v) => { const ks = p.split("."); let a = o; for (const k of ks.slice(0, -1)) a = a[k] ??= {}; a[ks.at(-1)] = v; };

export function medianize(runs) {
  const good = runs.filter((r) => r.reachable);
  if (!good.length) return runs[0];
  const out = JSON.parse(JSON.stringify(good[0]));
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const mid = s.length / 2; return s.length % 2 ? s[Math.floor(mid)] : (s[mid - 1] + s[mid]) / 2; };
  for (const p of NUM_PATHS) set(out, p, median(good.map((r) => get(r, p) ?? 0)));
  for (const p of BOOL_PATHS) set(out, p, good.filter((r) => get(r, p)).length * 2 > good.length);
  return out;
}

function selftest() {
  const mk = (avg, jack) => ({ reachable: true, fps: { avg, droppedPct: 0, samples: 1 }, scroll: { docHeight: 1, viewportHeight: 1, sections: 1, pinnedRanges: 0, scrollJack: jack }, motion: { changedNodes: 0, animatedNodes: 0, changedRatio: 0, transformOpacityOnly: 1, parallaxLayers: 0, entranceStagger: false }, stability: { clsProxy: 0 }, a11y: { reducedMotionHonored: true, focusVisible: true, contrastFailures: 0, motionToggle: false }, console: { errors: 0, failedRequests: 0 } });
  const m = medianize([mk(30, true), mk(60, false), mk(50, false)]);
  if (m.fps.avg !== 50) { console.error("✗ cli selftest: median fps expected 50, got " + m.fps.avg); process.exit(1); }
  if (m.scroll.scrollJack !== false) { console.error("✗ cli selftest: boolean majority expected false"); process.exit(1); }
  const two = medianize([mk(30, false), mk(60, false)]);
  if (two.fps.avg !== 45) { console.error("✗ cli selftest: even-array median expected 45, got " + two.fps.avg); process.exit(1); }
  const withBad = medianize([{ reachable: false, unmeasurable_reason: "x" }, mk(50, false), mk(70, false)]);
  if (withBad.fps.avg !== 60) { console.error("✗ cli selftest: unreachable runs must be excluded, expected 60, got " + withBad.fps.avg); process.exit(1); }
  const allBad = medianize([{ reachable: false, unmeasurable_reason: "x" }]);
  if (allBad.reachable !== false) { console.error("✗ cli selftest: all-unreachable must return runs[0]"); process.exit(1); }
  console.log("✓ cli selftest: medianize — numeric median (odd+even), boolean majority, unreachable excluded.");
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) selftest();
  const url = args.find((a) => !a.startsWith("--"));
  if (!url || !/^https?:\/\//.test(url)) { console.error("usage: cinematic-bench <https://url> [--runs 3] [--json] [--out file]"); process.exit(2); }
  const opt = (n, d) => { const i = args.indexOf("--" + n); return i > -1 && args[i + 1] ? args[i + 1] : d; };
  const runsRaw = Number(opt("runs", 3)); if (!Number.isFinite(runsRaw) || runsRaw < 1) { console.error("usage: cinematic-bench <https://url> [--runs 3] [--json] [--out file]"); process.exit(2); } const runsN = Math.floor(runsRaw);
  const runs = [];
  try {
    for (let i = 0; i < runsN; i++) { console.error(`run ${i + 1}/${runsN} …`); runs.push(await capture(url)); }
  } catch (e) { console.error(`✗ cinematic-bench: ${e.message}`); process.exit(1); }
  const m = medianize(runs);
  if (!m.reachable) { console.error(`✗ cinematic-bench: unmeasurable — ${m.unmeasurable_reason}`); process.exit(1); }
  const s = scoreMeasurements(m);
  const result = { bench_version: BENCH_VERSION, url, ts: m.ts, runs: runs.length, scores: s, measurements: m };
  if (opt("out", null)) writeFileSync(opt("out", null), JSON.stringify(result, null, 2) + "\n");
  if (args.includes("--json")) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
  const bar = (v) => "█".repeat(Math.round(v / 10)).padEnd(10, "░");
  console.log(`\nCinematicBench v${BENCH_VERSION} — ${url}\n`);
  console.log(`  Pacing         ${bar(s.pacing)}  ${s.pacing}`);
  console.log(`  Performance    ${bar(s.performance)}  ${s.performance}   (fps varies with hardware)`);
  console.log(`  Accessibility  ${bar(s.a11y)}  ${s.a11y}`);
  console.log(`  Motion Craft   ${bar(s.motionCraft)}  ${s.motionCraft}`);
  console.log(`\n  OVERALL        ${s.overall}/100   (median of ${runs.length} run(s))`);
  console.log(`\n  Compare: https://mustbesimo.github.io/cinematic-scroll-skill/bench/\n`);
  process.exit(0);
}
