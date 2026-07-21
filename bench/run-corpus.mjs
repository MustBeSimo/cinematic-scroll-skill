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
mkdirSync(join(HERE, "raw"), { recursive: true });   // raw per-run captures, archived for provenance
const slug = (u) => new URL(u).hostname.replace(/^www\./, "").replace(/[^a-z0-9.]/gi, "-") + (new URL(u).pathname !== "/" ? "-" + new URL(u).pathname.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") : "");

// Optional round-robin sharding for parallel workers: --shard=2/5 runs sites 1,6,11,… (0-indexed
// idx where idx%N === i-1). Results are per-file + resumable, so N concurrent processes are safe.
let SHARD = 0, SHARDS = 1;
const shardArg = process.argv.find((a) => a.startsWith("--shard="));
if (shardArg) { const [i, n] = shardArg.split("=")[1].split("/").map(Number); if (i >= 1 && n >= 1 && i <= n) { SHARD = i - 1; SHARDS = n; } }

let ranked = 0, unmeasurable = 0, skipped = 0, envWritten = false;
for (let idx = 0; idx < sites.length; idx++) {
  if (idx % SHARDS !== SHARD) continue;
  const site = sites[idx];
  const out = join(HERE, "results", slug(site.url) + ".json");
  if (existsSync(out)) { skipped++; continue; }
  console.log(`bench ${site.name} — ${site.url}`);
  const runs = [];
  try { for (let i = 0; i < 3; i++) runs.push(await capture(site.url)); }
  catch (e) { console.error(`  environment error: ${e.message}`); process.exit(1); }
  const env = runs.find((r) => r.environment)?.environment || null;
  // Reference run must be hardware-GL: a software rasterizer makes the performance axis meaningless.
  if (env && env.softwareGL) {
    console.error(`✗ reference run ABORTED: software GL renderer (${env.renderer}). The published corpus must run on hardware GL — use a GPU-backed Chrome.`);
    process.exit(1);
  }
  // Archive the raw (pre-median) captures + write the run-environment manifest once.
  writeFileSync(join(HERE, "raw", slug(site.url) + ".json"), JSON.stringify({ url: site.url, ts: new Date().toISOString(), runs }, null, 2) + "\n");
  if (env && !envWritten) {
    writeFileSync(join(HERE, "RUN-ENVIRONMENT.json"), JSON.stringify({ ranAt: new Date().toISOString(), node: process.version, benchVersion: BENCH_VERSION, viewport: "1440x900", runsPerSite: 3, ...env }, null, 2) + "\n");
    envWritten = true;
  }
  const m = medianize(runs);
  const result = { bench_version: BENCH_VERSION, name: site.name, category: site.category, url: site.url, ts: m.ts || new Date().toISOString(), runs: runs.length, environment: env, scores: m.reachable ? scoreMeasurements(m) : null, unmeasurable_reason: m.reachable ? null : m.unmeasurable_reason, measurements: m.reachable ? m : undefined };
  writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  if (result.scores) { ranked++; console.log(`  → ${result.scores.overall}/100`); } else { unmeasurable++; console.log(`  → unmeasurable: ${result.unmeasurable_reason}`); }
}
console.log(`\n✓ run-corpus: ${ranked} scored, ${unmeasurable} unmeasurable, ${skipped} already done.`);
