#!/usr/bin/env node
/* sync-manifest.mjs — project shelf-entry IR frontmatter into references/learned/manifest.json.
   Deterministic (sorted by entry_id, no timestamps). --check verifies without writing. */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectEntries } from "./lib/entries.mjs";
import { SCHEMA_VERSION } from "./lib/schema.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");
const PROJECT = ["entry_id", "slug", "type", "status", "name", "source_url", "observed_date"];

export function buildManifest(entries) {
  const rows = entries.filter((en) => !en.error).map((en) => {
    const d = en.data, row = {};
    for (const k of PROJECT) row[k] = d[k];
    row.tags = (d.applicability && d.applicability.tags) || [];
    row.scores = d.scores || {};
    row.cluster_id = (d.promotion && d.promotion.cluster_id) || "";
    row.path = `references/learned/${en.dir}/${en.file}`;
    return row;
  }).sort((a, b) => String(a.entry_id).localeCompare(String(b.entry_id)));
  return { schema_version: SCHEMA_VERSION, generated_by: "tools/learn/sync-manifest.mjs", entries: rows };
}

const manifestPath = (root) => join(root, "references/learned/manifest.json");
const serialize = (m) => JSON.stringify(m, null, 2) + "\n";

function run(root, check) {
  const built = serialize(buildManifest(collectEntries(root)));
  const p = manifestPath(root);
  if (check) { const cur = existsSync(p) ? readFileSync(p, "utf8") : ""; return cur === built ? { ok: true } : { ok: false, msg: "manifest.json is stale — run `node tools/learn/sync-manifest.mjs`" }; }
  writeFileSync(p, built);
  return { ok: true, wrote: p };
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-manifest-"));
  try {
    const tdir = join(dir, "references/learned/techniques");
    mkdirSync(tdir, { recursive: true });
    writeFileSync(join(tdir, "valid.md"), VALID_ENTRY_TEXT);
    run(dir, false);
    if (!run(dir, true).ok) { console.error("✗ sync-manifest selftest: --check failed right after write"); process.exit(1); }
    if (!JSON.parse(readFileSync(manifestPath(dir), "utf8")).entries.length) { console.error("✗ sync-manifest selftest: entry not projected into manifest"); process.exit(1); }
    writeFileSync(manifestPath(dir), '{"schema_version":"1.0","entries":[]}\n');
    if (run(dir, true).ok) { console.error("✗ sync-manifest selftest: stale manifest not detected"); process.exit(1); }
    console.log("✓ sync-manifest selftest: projects entries, writes deterministically, --check detects drift.");
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
    const r = run(root, argv.includes("--check"));
    if (!r.ok) { console.error(`✗ sync-manifest: ${r.msg}`); process.exit(1); }
    console.log(argv.includes("--check") ? "✓ sync-manifest: manifest.json in sync." : `✓ sync-manifest: wrote ${r.wrote}`);
    process.exit(0);
  }
}
