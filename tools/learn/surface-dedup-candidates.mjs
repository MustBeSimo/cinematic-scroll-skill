#!/usr/bin/env node
/* surface-dedup-candidates.mjs — surface possible duplicates for a candidate by TAG overlap
   (Jaccard) only. NO embeddings, NO semantic model. The agent makes the create|merge|skip call. */
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest } from "./sync-manifest.mjs";
import { collectEntries } from "./lib/entries.mjs";
import { VALID_ENTRY_TEXT } from "./lib/fixtures.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_DEFAULT = join(HERE, "..", "..");

export function rankCandidates(tags, type, manifest) {
  const set = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));
  return manifest.entries
    .filter((e) => !type || e.type === type)
    .map((e) => {
      const et = new Set((e.tags || []).map((t) => t.toLowerCase()));
      const shared = [...set].filter((t) => et.has(t));
      const union = new Set([...set, ...et]);
      return { entry_id: e.entry_id, name: e.name, type: e.type, shared, jaccard: union.size ? shared.length / union.size : 0 };
    })
    .filter((r) => r.shared.length > 0)
    .sort((a, b) => b.jaccard - a.jaccard);
}

function loadManifest(root) {
  const p = join(root, "references/learned/manifest.json");
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  return buildManifest(collectEntries(root));
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "learn-dedup-"));
  try {
    mkdirSync(join(dir, "references/learned/techniques"), { recursive: true });
    writeFileSync(join(dir, "references/learned/techniques/valid.md"), VALID_ENTRY_TEXT);
    const man = loadManifest(dir);
    const hit = rankCandidates(["scroll-sync", "opacity", "parallax"], "technique", man);
    if (!hit.length || hit[0].shared.length < 2) { console.error("✗ dedup selftest: expected overlap on shared tags"); process.exit(1); }
    const miss = rankCandidates(["totally", "unrelated"], "technique", man);
    if (miss.length) { console.error("✗ dedup selftest: non-overlapping tags should surface nothing"); process.exit(1); }
    console.log("✓ surface-dedup-candidates selftest: ranks by tag overlap; ignores non-overlap.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  process.exit(0);
}

// realpath-resolved: npm's node_modules/.bin/ symlinks (how npx always invokes bins) and
// macOS's /tmp -> /private/tmp both break a raw argv[1]-vs-import.meta.url comparison.
let isMain = false;
try { isMain = !!process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]); } catch { isMain = false; }
if (isMain) {
  const argv = process.argv.slice(2);
  const arg = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
  const root = arg("root") || ROOT_DEFAULT;
  if (argv.includes("--selftest")) selftest();
  else {
    const tags = (arg("tags") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!tags.length) { console.error('usage: --tags "a,b,c" [--type technique] [--top N]'); process.exit(2); }
    const ranked = rankCandidates(tags, arg("type"), loadManifest(root)).slice(0, Number(arg("top") || 5));
    if (!ranked.length) { console.log("No tag-overlapping entries — likely novel (agent confirms)."); process.exit(0); }
    console.log("Possible duplicates by tag overlap (agent decides create|merge|skip):");
    for (const r of ranked) console.log(`  ${r.jaccard.toFixed(2)}  ${r.entry_id}  [${r.shared.join(", ")}]  ${r.name}`);
    process.exit(0);
  }
}
