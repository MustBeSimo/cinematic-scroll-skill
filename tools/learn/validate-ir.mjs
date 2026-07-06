#!/usr/bin/env node
/* validate-ir.mjs — the IR gate. Validates every shelf entry's frontmatter against the
   Pattern IR schema. Zero deps. Structure/integrity only — no semantic judgment. */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { TYPES, STATUSES, DEDUP_ACTIONS, OBSERVATION_METHODS, COMPLEXITY, REQUIRED, FIREWALL_FLAGS, SCHEMA_VERSION, TYPE_DIR } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const has = (o, p) => { let a = o; for (const k of p.split(".")) { if (a == null || typeof a !== "object" || !(k in a)) return false; a = a[k]; } return true; };
const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const num01 = (x) => typeof x === "number" && x >= 0 && x <= 1;

export function validateEntry(data) {
  const e = [];
  for (const p of REQUIRED) if (!has(data, p)) e.push(`missing field: ${p}`);
  if (has(data, "schema_version") && get(data, "schema_version") !== SCHEMA_VERSION) e.push(`schema_version must be "${SCHEMA_VERSION}"`);
  if (has(data, "type") && !TYPES.includes(get(data, "type"))) e.push(`type not in ${TYPES.join("|")}`);
  if (has(data, "status") && !STATUSES.includes(get(data, "status"))) e.push(`status not in ${STATUSES.join("|")}`);
  if (has(data, "evidence.observation_method") && !OBSERVATION_METHODS.includes(get(data, "evidence.observation_method"))) e.push(`evidence.observation_method not in ${OBSERVATION_METHODS.join("|")}`);
  if (has(data, "applicability.complexity") && !COMPLEXITY.includes(get(data, "applicability.complexity"))) e.push(`applicability.complexity not in ${COMPLEXITY.join("|")}`);
  if (has(data, "dedup.action") && !DEDUP_ACTIONS.includes(get(data, "dedup.action"))) e.push(`dedup.action not in ${DEDUP_ACTIONS.join("|")}`);
  if (has(data, "machine_distilled") && get(data, "machine_distilled") !== true) e.push("machine_distilled must be true");
  if (has(data, "evidence.copied_material") && get(data, "evidence.copied_material") !== false) e.push("evidence.copied_material must be false (originality firewall)");
  for (const f of FIREWALL_FLAGS) if (has(data, `originality_firewall.${f}`) && get(data, `originality_firewall.${f}`) !== true) e.push(`originality_firewall.${f} must be true`);
  const tags = get(data, "applicability.tags");
  if (!Array.isArray(tags) || tags.length < 1 || !tags.every((t) => typeof t === "string")) e.push("applicability.tags must be a non-empty string array");
  for (const arr of ["applicability.best_for", "applicability.avoid_when", "applicability.compatible_buckets", "evidence.source_elements"]) {
    if (has(data, arr) && !Array.isArray(get(data, arr))) e.push(`${arr} must be an array`);
  }
  for (const s of ["scores.confidence", "scores.novelty", "scores.originality_risk"]) if (has(data, s) && !num01(get(data, s))) e.push(`${s} must be a number in [0,1]`);
  if (has(data, "scores.reuse")) { const r = get(data, "scores.reuse"); if (r !== null && !num01(r)) e.push("scores.reuse must be null or a number in [0,1]"); }
  for (const s of ["entry_id", "slug", "name"]) if (has(data, s) && !(typeof get(data, s) === "string" && get(data, s).length > 0)) e.push(`${s} must be a non-empty string`);
  return e;
}

function run(root) {
  const entries = collectEntries(root);
  const errors = [];
  const seen = new Map();
  for (const en of entries) {
    if (en.error) { errors.push(`${en.dir}/${en.file}: ${en.error}`); continue; }
    for (const msg of validateEntry(en.data)) errors.push(`${en.dir}/${en.file}: ${msg}`);
    const id = en.data.entry_id;
    if (typeof id === "string" && id) {
      if (seen.has(id)) errors.push(`${en.dir}/${en.file}: duplicate entry_id "${id}" (also ${seen.get(id)})`);
      else seen.set(id, `${en.dir}/${en.file}`);
    }
    const expectDir = TYPE_DIR[en.data.type];
    if (expectDir && en.dir !== expectDir) errors.push(`${en.dir}/${en.file}: type "${en.data.type}" should live in references/learned/${expectDir}/`);
  }
  return { count: entries.length, errors };
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-validate-"));
  try {
    const tdir = join(dir, "references/learned/techniques");
    mkdirSync(tdir, { recursive: true });
    writeFileSync(join(tdir, "valid.md"), VALID_ENTRY_TEXT);
    let r = run(dir);
    if (r.errors.length) { console.error("✗ validate-ir selftest: valid entry rejected:\n  " + r.errors.join("\n  ")); process.exit(1); }
    const bad = VALID_ENTRY_TEXT.replace("status: accepted", "status: bogus").replace("no_brand_copy: true", "no_brand_copy: false");
    writeFileSync(join(tdir, "valid.md"), bad);
    r = run(dir);
    if (r.errors.length < 2) { console.error("✗ validate-ir selftest: corrupt entry not flagged"); process.exit(1); }
    // Phase 3: malformed-frontmatter entry must not throw; must surface error mentioning filename
    writeFileSync(join(tdir, "valid.md"), VALID_ENTRY_TEXT); // restore valid so only malformed.md is bad
    writeFileSync(join(tdir, "malformed.md"), "no frontmatter here");
    let threw = false;
    let rMalformed;
    try { rMalformed = run(dir); } catch { threw = true; }
    if (threw) { console.error("✗ validate-ir selftest: run() threw on malformed entry (should collect error)"); process.exit(1); }
    if (!rMalformed.errors.some((e) => e.includes("malformed.md"))) {
      console.error("✗ validate-ir selftest: malformed.md not reported in errors:\n  " + rMalformed.errors.join("\n  ")); process.exit(1);
    }
    console.log("✓ validate-ir selftest: valid passes; bad status + firewall flag fail; malformed entry collected without throw.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

// realpath-resolved: npm's node_modules/.bin/ symlinks (how npx always invokes bins) and
// macOS's /tmp -> /private/tmp both break a raw argv[1]-vs-import.meta.url comparison.
let isMain = false;
try { isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]); } catch { isMain = false; }
if (isMain) {
  const argv = process.argv.slice(2);
  const root = (argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : null) || ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const { count, errors } = run(root);
    if (errors.length) { console.error(`✗ validate-ir: ${errors.length} problem(s) across ${count} entr(y/ies):`); errors.forEach((e) => console.error(`  - ${e}`)); process.exit(1); }
    console.log(`✓ validate-ir: ${count} shelf entr(y/ies) conform to the Pattern IR.`);
    process.exit(0);
  }
}
