#!/usr/bin/env node
/* run-corpus.mjs — bench every site in sites.json (median-of-3) and write results/<slug>.json.
   Resumable: skips sites whose result file already exists (delete a file to re-bench it). */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { capture } from "../tools/bench/capture.mjs";
import { medianize } from "../tools/bench/cli.mjs";
import { scoreMeasurements, BENCH_VERSION } from "../tools/bench/score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { sites } = JSON.parse(readFileSync(join(HERE, "sites.json"), "utf8"));
mkdirSync(join(HERE, "results"), { recursive: true });
const slug = (u) => new URL(u).hostname.replace(/^www\./, "").replace(/[^a-z0-9.]/gi, "-") + (new URL(u).pathname !== "/" ? "-" + new URL(u).pathname.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") : "");

let ranked = 0, unmeasurable = 0, skipped = 0;
for (const site of sites) {
  const out = join(HERE, "results", slug(site.url) + ".json");
  if (existsSync(out)) { skipped++; continue; }
  console.log(`bench ${site.name} — ${site.url}`);
  const runs = [];
  try { for (let i = 0; i < 3; i++) runs.push(await capture(site.url)); }
  catch (e) { console.error(`  environment error: ${e.message}`); process.exit(1); }
  const m = medianize(runs);
  const result = { bench_version: BENCH_VERSION, name: site.name, category: site.category, url: site.url, ts: m.ts || new Date().toISOString(), runs: runs.length, scores: m.reachable ? scoreMeasurements(m) : null, unmeasurable_reason: m.reachable ? null : m.unmeasurable_reason, measurements: m.reachable ? m : undefined };
  writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  if (result.scores) { ranked++; console.log(`  → ${result.scores.overall}/100`); } else { unmeasurable++; console.log(`  → unmeasurable: ${result.unmeasurable_reason}`); }
}
console.log(`\n✓ run-corpus: ${ranked} scored, ${unmeasurable} unmeasurable, ${skipped} already done.`);
