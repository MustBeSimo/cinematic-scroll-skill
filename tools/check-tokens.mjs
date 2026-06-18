#!/usr/bin/env node
/**
 * check-tokens.mjs — Phase 1 verification gate for the cinematic-scroll design contract.
 *
 * Validates the DTCG token set in tokens/ :
 *   1. Every *.tokens.json parses as JSON.
 *   2. Token tree is well-formed; collects every token (node with $value) by dot-path,
 *      tracking $type inherited from ancestor groups.
 *   3. Every alias  "{group.path.token}"  resolves to a real token (no dangling refs, no cycles).
 *   4. Light per-type shape checks (cubicBezier = 4 numbers, dimension = {value,unit}, etc.).
 *   5. Required role tokens exist (the cross-system contract) and the four canonical
 *      easing curves match taste-guardrails §4.1 exactly.
 *
 * Exit 0 = contract is sound. Exit 1 = at least one failure (printed). Zero dependencies.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_DIR = join(ROOT, "tokens");

const errors = [];
const fail = (m) => errors.push(m);

// ---- 1. load + parse ----------------------------------------------------
let files = [];
try {
  files = readdirSync(TOKENS_DIR).filter((f) => f.endsWith(".tokens.json")).sort();
} catch {
  console.error(`✗ tokens/ directory not found at ${TOKENS_DIR}`);
  process.exit(1);
}
if (files.length === 0) {
  console.error("✗ no *.tokens.json files in tokens/");
  process.exit(1);
}

const trees = {};
for (const f of files) {
  const p = join(TOKENS_DIR, f);
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail(`${f}: top-level must be a JSON object`);
    else trees[f] = parsed;
  } catch (e) {
    fail(`${f}: invalid JSON — ${e.message}`);
  }
}

// deep-merge all trees into one (token files are disjoint by group, but merge defensively)
function merge(a, b) {
  for (const k of Object.keys(b)) {
    if (k in a && a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object" && !Array.isArray(a[k])) {
      merge(a[k], b[k]);
    } else {
      a[k] = b[k];
    }
  }
  return a;
}
const root = Object.values(trees).reduce((acc, t) => merge(acc, t), {});

// ---- 2. collect tokens with inherited $type -----------------------------
const tokens = new Map(); // dot-path -> { type, value, raw }
function isMeta(k) { return k.startsWith("$"); }
function walk(node, path, inheritedType) {
  const type = node.$type || inheritedType;
  if (Object.prototype.hasOwnProperty.call(node, "$value")) {
    tokens.set(path, { type, value: node.$value, raw: node });
    return;
  }
  for (const k of Object.keys(node)) {
    if (isMeta(k)) continue;
    const child = node[k];
    if (child && typeof child === "object" && !Array.isArray(child)) {
      walk(child, path ? `${path}.${k}` : k, type);
    }
  }
}
walk(root, "", undefined);

if (tokens.size === 0) fail("no tokens ($value nodes) found");

// ---- 3. alias resolution + cycle detection ------------------------------
const ALIAS = /^\{([^}]+)\}$/;
function resolve(path, seen = []) {
  const tok = tokens.get(path);
  if (!tok) return { ok: false, reason: `missing token '${path}'` };
  if (typeof tok.value === "string") {
    const m = tok.value.match(ALIAS);
    if (m) {
      const target = m[1];
      if (seen.includes(path)) return { ok: false, reason: `alias cycle: ${[...seen, path].join(" → ")}` };
      const r = resolve(target, [...seen, path]);
      return r.ok ? { ok: true, type: tok.type || r.type, value: r.value } : r;
    }
  }
  return { ok: true, type: tok.type, value: tok.value };
}

for (const [path, tok] of tokens) {
  if (typeof tok.value === "string" && ALIAS.test(tok.value)) {
    const r = resolve(path);
    if (!r.ok) fail(`alias '${path}' → ${tok.value}: ${r.reason}`);
  }
}

// ---- 4. light per-type shape checks (on resolved values) ----------------
function shapeOk(type, v) {
  switch (type) {
    case "cubicBezier":
      return Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === "number");
    case "dimension":
    case "duration":
      return v && typeof v === "object" && typeof v.value === "number" && typeof v.unit === "string";
    case "number":
      return typeof v === "number";
    case "fontWeight":
      return typeof v === "number" || typeof v === "string";
    case "color":
      return typeof v === "string" && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
    case "fontFamily":
      return Array.isArray(v) ? v.every((s) => typeof s === "string") : typeof v === "string";
    default:
      return true; // unknown / untyped — skip
  }
}
for (const [path, tok] of tokens) {
  const r = resolve(path);
  if (!r.ok) continue; // already reported
  if (!shapeOk(r.type, r.value)) {
    fail(`token '${path}' ($type ${r.type || "—"}) has malformed $value: ${JSON.stringify(r.value)}`);
  }
}

// ---- 5. required contract + canonical easings ---------------------------
const REQUIRED = [
  "semantic.color.bg", "semantic.color.surface", "semantic.color.fg",
  "semantic.color.fg-dim", "semantic.color.accent", "semantic.color.line",
  "semantic.font.display", "semantic.font.body", "semantic.font.ui",
  "semantic.ease.reveal", "semantic.ease.exit", "semantic.ease.playful", "semantic.ease.cut",
  "semantic.duration.title",
  "core.space.xs", "core.radius.md", "core.size.body", "core.color.neutral.500",
  "motion.duration.base", "motion.pacing.pin-min-vh", "motion.depth.mid",
];
for (const p of REQUIRED) {
  if (!tokens.has(p)) fail(`required token missing: '${p}'`);
}

const CANON = {
  "motion.ease.reveal": [0.16, 1, 0.3, 1],
  "motion.ease.exit": [0.7, 0, 0.84, 0],
  "motion.ease.playful": [0.34, 1.56, 0.64, 1],
  "motion.ease.cut": [0.87, 0, 0.13, 1],
};
for (const [p, want] of Object.entries(CANON)) {
  const t = tokens.get(p);
  if (!t) { fail(`canonical easing missing: '${p}'`); continue; }
  const got = JSON.stringify(t.value);
  if (got !== JSON.stringify(want)) fail(`canonical easing '${p}' = ${got}, expected ${JSON.stringify(want)} (taste-guardrails §4.1)`);
}

// The role tokens components actually consume must RESOLVE to the canonical curves
// (catches a semantic.ease.* alias pointed at the wrong primitive).
const SEM_CANON = {
  "semantic.ease.reveal": [0.16, 1, 0.3, 1],
  "semantic.ease.exit": [0.7, 0, 0.84, 0],
  "semantic.ease.playful": [0.34, 1.56, 0.64, 1],
  "semantic.ease.cut": [0.87, 0, 0.13, 1],
};
for (const [p, want] of Object.entries(SEM_CANON)) {
  if (!tokens.has(p)) { fail(`semantic ease role missing: '${p}'`); continue; }
  const r = resolve(p);
  if (!r.ok) { fail(`semantic ease '${p}' does not resolve: ${r.reason}`); continue; }
  if (JSON.stringify(r.value) !== JSON.stringify(want)) fail(`semantic ease '${p}' resolves to ${JSON.stringify(r.value)}, expected ${JSON.stringify(want)}`);
}

// presence of the named groups the audit gate calls out
for (const sub of ["color", "space", "radius", "ease", "duration"]) {
  const hit = [...tokens.keys()].some((k) => k.includes(`.${sub}.`) || k.includes(`.${sub}`));
  if (!hit) fail(`expected a '${sub}' token group somewhere in the contract`);
}

// ---- report -------------------------------------------------------------
const aliasCount = [...tokens.values()].filter((t) => typeof t.value === "string" && ALIAS.test(t.value)).length;
if (errors.length) {
  console.error(`\n✗ check-tokens: ${errors.length} problem(s) in ${files.length} file(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ check-tokens: ${tokens.size} tokens across ${files.length} files (${aliasCount} aliases resolved, 4 canonical easings verified, ${REQUIRED.length} required roles present).`);
process.exit(0);
