#!/usr/bin/env node
/**
 * check-themes.mjs — Phase 3 verification gate.
 *
 * For every themes/*.theme.json:
 *   1. Defines all required role keys (color: bg/surface/fg/fg-dim/accent/line; font: display/body/ui).
 *   2. After merging over the base token contract, every alias resolves (no dangling refs / cycles).
 *   3. `fg` clears WCAG AA contrast (>= 4.5:1) on `bg`, and `accent` differs from `bg`.
 *
 * Exit 0 = all themes sound. Zero dependencies.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_DIR = join(ROOT, "tokens");
const THEMES_DIR = join(ROOT, "themes");

const load = (p) => JSON.parse(readFileSync(p, "utf8"));
function merge(a, b) {
  for (const k of Object.keys(b)) {
    if (k in a && a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object" && !Array.isArray(a[k])) merge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
const baseFiles = readdirSync(TOKENS_DIR).filter((f) => f.endsWith(".tokens.json")).sort();
const base = baseFiles.map((f) => load(join(TOKENS_DIR, f))).reduce((acc, t) => merge(acc, t), {});

function collect(root) {
  const map = new Map();
  (function walk(node, path, it) {
    const type = node.$type || it;
    if (Object.prototype.hasOwnProperty.call(node, "$value")) { map.set(path, { type, value: node.$value }); return; }
    for (const k of Object.keys(node)) { if (k.startsWith("$")) continue; const c = node[k]; if (c && typeof c === "object" && !Array.isArray(c)) walk(c, path ? `${path}.${k}` : k, type); }
  })(root, "", undefined);
  return map;
}
const ALIAS = /^\{([^}]+)\}$/;
function makeResolver(map) {
  return function resolve(path, seen = []) {
    const t = map.get(path);
    if (!t) return { ok: false, reason: `missing '${path}'` };
    if (typeof t.value === "string") {
      const m = t.value.match(ALIAS);
      if (m) {
        if (seen.includes(path)) return { ok: false, reason: `cycle ${[...seen, path].join("→")}` };
        return resolve(m[1], [...seen, path]);
      }
    }
    return { ok: true, type: t.type, value: t.value };
  };
}

// WCAG relative luminance + contrast
function lum(hex) {
  const h = hex.replace("#", "").slice(0, 6);
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };

const REQ_COLOR = ["bg", "surface", "fg", "fg-dim", "accent", "line"];
const REQ_FONT = ["display", "body", "ui"];

const themeFiles = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".theme.json")).sort();
if (themeFiles.length === 0) { console.error("✗ no themes/*.theme.json found"); process.exit(1); }

let failed = 0;
const rows = [];
for (const f of themeFiles) {
  const errs = [];
  let theme;
  try { theme = load(join(THEMES_DIR, f)); } catch (e) { console.error(`✗ ${f}: invalid JSON — ${e.message}`); failed++; continue; }
  const sc = theme.semantic?.color || {};
  const sf = theme.semantic?.font || {};
  for (const k of REQ_COLOR) if (!(sc[k] && "$value" in sc[k])) errs.push(`missing color.${k}`);
  for (const k of REQ_FONT) if (!(sf[k] && "$value" in sf[k])) errs.push(`missing font.${k}`);

  // merge over a fresh clone of base, resolve every alias
  const merged = merge(structuredClone(base), theme);
  const map = collect(merged);
  const resolve = makeResolver(map);
  for (const [p, t] of map) {
    if (typeof t.value === "string" && ALIAS.test(t.value)) {
      const r = resolve(p);
      if (!r.ok) errs.push(`alias ${p}: ${r.reason}`);
    }
  }

  // contrast — resolve via the merged map (handles aliases) and normalize short hex,
  // so a theme can't dodge the gate by aliasing or using #abc. fg AND fg-dim are checked.
  const hex6 = (v) => {
    if (typeof v !== "string") return null;
    let h = v.trim();
    if (/^#[0-9a-fA-F]{3}$/.test(h)) h = "#" + h.slice(1).split("").map((c) => c + c).join("");
    return /^#[0-9a-fA-F]{6}/.test(h) ? h.slice(0, 7) : null;
  };
  const rc = (role) => { const r = resolve(`semantic.color.${role}`); return r.ok ? hex6(r.value) : null; };
  const bg = rc("bg"), fg = rc("fg"), fgDim = rc("fg-dim"), accent = rc("accent");
  let ratio = null;
  if (bg && fg) { ratio = contrast(fg, bg); if (ratio < 4.5) errs.push(`fg/bg contrast ${ratio.toFixed(2)}:1 < 4.5 (WCAG AA)`); }
  else errs.push("fg/bg not resolvable to a hex value for the contrast check");
  if (bg && fgDim) { const rd = contrast(fgDim, bg); if (rd < 3.0) errs.push(`fg-dim/bg contrast ${rd.toFixed(2)}:1 < 3.0 (secondary text needs AA-large)`); }
  if (accent && bg && accent === bg) errs.push("accent equals bg");

  const name = basename(f).replace(/\.theme\.json$/, "");
  if (errs.length) { failed++; rows.push(`✗ ${name}: ${errs.join("; ")}`); }
  else rows.push(`✓ ${name}  (fg/bg ${ratio ? ratio.toFixed(1) : "—"}:1)`);
}

console.log(rows.join("\n"));
if (failed) { console.error(`\n✗ check-themes: ${failed}/${themeFiles.length} theme(s) failed.`); process.exit(1); }
console.log(`\n✓ check-themes: ${themeFiles.length} themes valid (contract + aliases + AA contrast).`);
process.exit(0);
