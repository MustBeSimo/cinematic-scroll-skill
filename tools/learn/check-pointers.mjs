#!/usr/bin/env node
/* check-pointers.mjs — bidirectional integrity between the learned shelf and the canon
   "## Learned additions" pointer sections. Zero deps. */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { TYPE_HOST, TYPE_DIR } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT, pointerLine } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const POINTER_RE = /<!--\s*learned:(\S+?)\s*-->/;
const PATH_RE = /references\/learned\/(techniques|themes|archetypes|taste)\/([^\s`)]+\.md)/;

function pointersInHost(root, host) {
  const p = join(root, host);
  if (!existsSync(p)) return [];
  const out = [];
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const idm = line.match(POINTER_RE);
    if (!idm) continue;
    const pm = line.match(PATH_RE);
    out.push({ id: idm[1], dir: pm ? pm[1] : null, file: pm ? pm[2] : null, host });
  }
  return out;
}

export function run(root) {
  const errors = [];
  const entries = collectEntries(root);
  const byId = new Map(entries.map((e) => [e.data.entry_id, e]));
  const pointers = [];
  for (const host of new Set(Object.values(TYPE_HOST))) pointers.push(...pointersInHost(root, host));
  for (const e of entries) {
    const host = TYPE_HOST[e.data.type];
    if (!pointers.some((p) => p.id === e.data.entry_id && p.host === host)) errors.push(`orphan entry: ${e.dir}/${e.file} (id ${e.data.entry_id}) has no pointer in ${host}`);
  }
  for (const p of pointers) {
    const e = byId.get(p.id);
    if (!e) { errors.push(`orphan pointer: ${p.host} -> learned id "${p.id}" has no shelf entry`); continue; }
    const expectDir = TYPE_DIR[e.data.type];
    if (p.dir && p.dir !== expectDir) errors.push(`pointer dir mismatch: ${p.host} -> ${p.id} points at ${p.dir}/ but entry is ${e.data.type} (expected ${expectDir}/)`);
    if (p.file && p.file !== e.file) errors.push(`pointer file mismatch: ${p.host} -> ${p.id} points at ${p.file} but entry file is ${e.file}`);
  }
  return { entries: entries.length, pointers: pointers.length, errors };
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-pointers-"));
  try {
    mkdirSync(join(dir, "references/learned/techniques"), { recursive: true });
    writeFileSync(join(dir, "references/learned/techniques/valid.md"), VALID_ENTRY_TEXT.replace(/slug: ".*"/, 'slug: "valid"'));
    const host = join(dir, "references/scroll-patterns.md");
    writeFileSync(host, `# Scroll patterns\n\n## Learned additions\n\n${pointerLine({ slug: "valid" })}\n`);
    let r = run(dir);
    if (r.errors.length) { console.error("✗ check-pointers selftest: clean tree flagged:\n  " + r.errors.join("\n  ")); process.exit(1); }
    writeFileSync(host, `# Scroll patterns\n\n## Learned additions\n\n`);
    r = run(dir);
    if (!r.errors.some((e) => e.includes("orphan entry"))) { console.error("✗ check-pointers selftest: missing pointer not detected"); process.exit(1); }
    console.log("✓ check-pointers selftest: clean passes; missing pointer flagged.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const root = argv.includes("--root") ? argv[argv.indexOf("--root") + 1] : ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const { entries, pointers, errors } = run(root);
    if (errors.length) { console.error(`✗ check-pointers: ${errors.length} problem(s):`); errors.forEach((e) => console.error(`  - ${e}`)); process.exit(1); }
    console.log(`✓ check-pointers: ${entries} entr(y/ies) ↔ ${pointers} pointer(s), no orphans.`);
    process.exit(0);
  }
}
