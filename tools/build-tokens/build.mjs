#!/usr/bin/env node
/**
 * build-tokens/build.mjs — Phase 2 token build pipeline (zero dependency).
 *
 * Reads the DTCG token set in tokens/, resolves every alias, and emits:
 *   - tokens/build/variables.css  — :root custom properties (terse semantic + namespaced core/motion)
 *   - tokens/build/tokens.ts      — typed `cssVars` map + GSAP easing map for Mode B
 *
 * Deterministic: same input → byte-identical output (the Phase 2 gate re-runs and diffs).
 * Zero deps by design — matches check-tokens.mjs / cinematic-doctor. Theme-aware: pass a
 * themes/*.theme.json overlay (Phase 3) to emit a per-system variables.css; default emits
 * the neutral-editorial semantic layer as shipped.
 *
 * Usage:  node tools/build-tokens/build.mjs [--theme themes/<name>.theme.json] [--out tokens/build]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOKENS_DIR = join(ROOT, "tokens");

// ---- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const getArg = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const themeFile = getArg("--theme");
const outDir = join(ROOT, getArg("--out") || "tokens/build");

// ---- load + merge -------------------------------------------------------
function loadJson(p) {
  try { return JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { console.error(`✗ build-tokens: cannot read ${p} — ${e.message}`); process.exit(1); }
}
function merge(a, b) {
  for (const k of Object.keys(b)) {
    if (k in a && a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object" && !Array.isArray(a[k])) merge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
const files = readdirSync(TOKENS_DIR).filter((f) => f.endsWith(".tokens.json")).sort();
const root = files.map((f) => loadJson(join(TOKENS_DIR, f))).reduce((acc, t) => merge(acc, t), {});
let themeName = "default";
if (themeFile) {
  const overlay = loadJson(join(ROOT, themeFile));
  merge(root, overlay); // theme overrides semantic.*
  themeName = basename(themeFile).replace(/\.theme\.json$/, "");
}

// ---- collect tokens (with inherited $type) ------------------------------
const tokens = new Map();
function walk(node, path, inheritedType) {
  const type = node.$type || inheritedType;
  if (Object.prototype.hasOwnProperty.call(node, "$value")) { tokens.set(path, { type, value: node.$value, raw: node }); return; }
  for (const k of Object.keys(node)) {
    if (k.startsWith("$")) continue;
    const c = node[k];
    if (c && typeof c === "object" && !Array.isArray(c)) walk(c, path ? `${path}.${k}` : k, type);
  }
}
walk(root, "", undefined);

const ALIAS = /^\{([^}]+)\}$/;
function resolve(path, seen = []) {
  const t = tokens.get(path);
  if (!t) { console.error(`✗ build-tokens: dangling alias → ${path}`); process.exit(1); }
  if (typeof t.value === "string") {
    const m = t.value.match(ALIAS);
    if (m) {
      if (seen.includes(path)) { console.error(`✗ build-tokens: alias cycle ${[...seen, path].join(" → ")}`); process.exit(1); }
      const r = resolve(m[1], [...seen, path]);
      return { type: t.type || r.type, value: r.value, raw: r.raw }; // propagate resolved primitive's raw ($extensions live there)
    }
  }
  return { type: t.type, value: t.value, raw: t.raw };
}

// ---- value → CSS string -------------------------------------------------
const round = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4))));
function cssValue(type, v) {
  switch (type) {
    case "color": return v;
    case "dimension":
    case "duration": return `${round(v.value)}${v.unit}`;
    case "cubicBezier": return `cubic-bezier(${v.map(round).join(", ")})`;
    case "number": return round(v);
    case "fontWeight": return typeof v === "number" ? String(v) : v;
    case "fontFamily": return (Array.isArray(v) ? v : [v]).map((s) => (/\s/.test(s) ? `"${s}"` : s)).join(", ");
    default: return String(v);
  }
}

// ---- dot-path → CSS var name (matches design.md) ------------------------
function varName(path) {
  const p = path.split(".");
  // semantic — terse, ergonomic API
  if (p[0] === "semantic") {
    const [, group, ...rest] = p; const key = rest.join("-");
    if (group === "color") return `--${key}`;            // --bg --accent --fg-dim
    if (group === "font") return `--font-${key}`;        // --font-display
    if (group === "ease") return `--ease-${key}`;        // --ease-reveal
    if (group === "duration") return `--dur-${key}`;     // --dur-title
    if (group === "type") return `--type-${key}`;        // --type-title
    if (group === "space") return `--${key}`;            // --gutter --section-y --stack
    return `--${group}-${key}`;
  }
  // core — namespaced, collision-free
  if (p[0] === "core") {
    const map = { space: "space", radius: "radius", size: "size", lineHeight: "lh", fontWeight: "weight",
                  tracking: "tracking", font: "font-stack", breakpoint: "bp", z: "z", scale: "scale" };
    const [, group, ...rest] = p;
    if (group === "color") return `--${rest.join("-")}`; // --neutral-500 --brand-amber --line-on-light
    return `--${map[group] || group}-${rest.join("-")}`;
  }
  // motion — ease is surfaced via semantic; others namespaced
  if (p[0] === "motion") {
    const [, group, ...rest] = p; const key = rest.join("-");
    if (group === "ease") return null;                   // identical to semantic --ease-*; skip dup
    if (group === "duration") return `--dur-${key}`;     // keys disjoint from semantic.duration
    return `--${group}-${key}`;                          // --stagger-base --pacing-pin-min-vh --depth-mid
  }
  return `--${p.join("-")}`;
}

// ---- fluid clamp for display sizes (replaces hand-written --fluid-*) -----
// linear interpolation between 360px and 1280px viewports.
const VW_MIN = 360, VW_MAX = 1280;
function fluid(remMax) {
  const remMin = Math.max(remMax * 0.62, 1.5);
  const slope = ((remMax - remMin) * 16) / (VW_MAX - VW_MIN);     // px per px-viewport
  const vw = round(slope * 100);
  const intercept = round(remMin - (slope * VW_MIN) / 16);
  return `clamp(${round(remMin)}rem, ${intercept}rem + ${vw}vw, ${round(remMax)}rem)`;
}
const FLUID_SIZES = ["h2", "h1", "display", "display-xl"];

// ---- emit ---------------------------------------------------------------
const lines = [];
const tsEntries = [];
const gsapEntries = [];
const seen = new Set();
function push(name, value) {
  if (!name || seen.has(name)) return;
  seen.add(name);
  lines.push(`  ${name}: ${value};`);
  tsEntries.push(`  ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
}

const order = ["semantic", "core", "motion"];
const sorted = [...tokens.keys()].sort((a, b) => {
  const ai = order.indexOf(a.split(".")[0]), bi = order.indexOf(b.split(".")[0]);
  return ai !== bi ? ai - bi : a.localeCompare(b);
});
for (const path of sorted) {
  const r = resolve(path);
  push(varName(path), cssValue(r.type, r.value));
  // collect GSAP easing names for Mode B
  if (r.type === "cubicBezier") {
    const g = r.raw?.$extensions?.["skill.cinematic-scroll"]?.gsap;
    const vn = varName(path);
    if (g && vn) gsapEntries.push(`  ${JSON.stringify(vn)}: ${JSON.stringify(g)},`);
  }
}
// fluid type
for (const key of FLUID_SIZES) {
  const t = tokens.get(`core.size.${key}`);
  if (t && t.value?.unit === "rem") push(`--fluid-${key}`, fluid(t.value.value));
}

const banner = `/* AUTO-GENERATED by tools/build-tokens/build.mjs — do not edit. theme: ${themeName}. */`;
const css = `${banner}\n:root {\n${lines.join("\n")}\n}\n`;
const ts = `${banner}
export const cssVars = {
${tsEntries.join("\n")}
} as const;
export type CssVar = keyof typeof cssVars;

/** GSAP easing names keyed by their CSS var, for Mode B (CustomEase / ease strings). */
export const gsapEase = {
${gsapEntries.join("\n")}
} as const;

/** \`var(--token)\` helper with autocomplete. */
export const v = (name: CssVar): string => \`var(\${name})\`;
`;

mkdirSync(outDir, { recursive: true });
const cssOut = join(outDir, themeFile ? `${themeName}.vars.css` : "variables.css");
const tsOut = join(outDir, "tokens.ts");
writeFileSync(cssOut, css);
if (!themeFile) writeFileSync(tsOut, ts);

console.log(`✓ build-tokens: ${seen.size} CSS vars (${gsapEntries.length} GSAP eases) → ${cssOut.replace(ROOT + "/", "")}${themeFile ? "" : `  +  tokens/build/tokens.ts`}`);
