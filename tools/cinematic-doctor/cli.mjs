#!/usr/bin/env node
/* ============================================================================
   cinematic-doctor — an executable quality gate for cinematic-scroll builds.

   Scores an HTML build 0-100 across five categories (taste, performance, a11y,
   mobile, 3D), prints a scorecard, writes cinematic-report.json, and exits
   non-zero below threshold so it can sit in CI / a pre-commit hook.

   Usage:
     node tools/cinematic-doctor/cli.mjs <path-to-html-or-dir>
     node tools/cinematic-doctor/cli.mjs <path> --min 85
     node tools/cinematic-doctor/cli.mjs --selftest
     node tools/cinematic-doctor/cli.mjs --json        # only print the JSON
     node tools/cinematic-doctor/cli.mjs --quiet       # no scorecard, just exit code

   Exit codes:
     0  total >= threshold (or --selftest passed)
     1  total <  threshold (or --selftest failed)
     2  usage / IO error
   ========================================================================== */

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDoc } from './lib/doc.mjs';
import { aggregate, renderScorecard, buildReport } from './lib/scorecard.mjs';

import { analyze as taste } from './checks/taste.mjs';
import { analyze as performance } from './checks/performance.mjs';
import { analyze as a11y } from './checks/a11y.mjs';
import { analyze as mobile } from './checks/mobile.mjs';
import { analyze as threed } from './checks/threed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIN = 80;
const CHECKS = [taste, performance, a11y, mobile, threed];

/** Run all checks against one HTML string, returning the aggregate. */
export function scoreHtml(raw, file = '<input>') {
  const doc = buildDoc(raw, file);
  const results = CHECKS.map((fn) => fn(doc));
  return aggregate(results);
}

/** Score a single file path. */
function scoreFile(file) {
  const raw = readFileSync(file, 'utf8');
  return scoreHtml(raw, file);
}

/** Collect candidate HTML files from a path (file or directory). */
function collectTargets(target) {
  const st = statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  // top-level *.html
  for (const name of readdirSync(target)) {
    if (name.endsWith('.html')) out.push(join(target, name));
  }
  // examples/*/index.html
  const examplesDir = join(target, 'examples');
  if (existsSync(examplesDir) && statSync(examplesDir).isDirectory()) {
    for (const name of readdirSync(examplesDir)) {
      const idx = join(examplesDir, name, 'index.html');
      if (existsSync(idx)) out.push(idx);
    }
  }
  return out;
}

function parseArgs(argv) {
  const opts = { min: DEFAULT_MIN, json: false, quiet: false, selftest: false, targets: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--selftest') opts.selftest = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--min') opts.min = Number(argv[++i]);
    else if (a.startsWith('--min=')) opts.min = Number(a.slice(6));
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a.startsWith('--')) { console.error(`unknown flag: ${a}`); process.exit(2); }
    else opts.targets.push(a);
  }
  if (!Number.isFinite(opts.min)) opts.min = DEFAULT_MIN;
  return opts;
}

const HELP = `cinematic-doctor — quality gate for cinematic-scroll builds

  node tools/cinematic-doctor/cli.mjs <path-to-html-or-dir> [--min N] [--json] [--quiet]
  node tools/cinematic-doctor/cli.mjs --selftest

Categories: taste(30) performance(25) a11y(20) mobile(15) threed(10, N/A unless 3D detected).
Weights re-normalize over applied categories. Default threshold ${DEFAULT_MIN} (override --min).
Exit 0 if total >= threshold, else 1. Writes cinematic-report.json next to the CLI.`;

/** --selftest: good.html must PASS, bad.html must FAIL. */
function runSelftest() {
  const fixtures = join(__dirname, 'fixtures');
  const good = join(fixtures, 'good.html');
  const bad = join(fixtures, 'bad.html');
  const min = DEFAULT_MIN;

  const goodAgg = scoreFile(good);
  const badAgg = scoreFile(bad);
  const goodPass = goodAgg.total >= min;
  const badPass = badAgg.total >= min;

  console.log('cinematic-doctor --selftest');
  console.log(`  good.html → ${goodAgg.total}/100  expected PASS (>=${min})  → ${goodPass ? 'PASS ✓' : 'FAIL ✗'}`);
  for (const c of goodAgg.categories) console.log(`      ${c.category.padEnd(12)} ${c.score}`);
  console.log(`  bad.html  → ${badAgg.total}/100  expected FAIL (<${min})   → ${!badPass ? 'FAIL ✓' : 'PASS ✗'}`);
  for (const c of badAgg.categories) console.log(`      ${c.category.padEnd(12)} ${c.score}`);

  const ok = goodPass && !badPass;
  console.log('');
  console.log(ok
    ? '  selftest OK — good PASSes, bad FAILs.'
    : `  selftest FAILED — good ${goodPass ? 'passed' : 'did NOT pass'}, bad ${badPass ? 'incorrectly passed' : 'correctly failed'}.`);
  return ok ? 0 : 1;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) { console.log(HELP); process.exit(0); }
  if (opts.selftest) process.exit(runSelftest());

  if (opts.targets.length === 0) {
    console.error(HELP);
    process.exit(2);
  }

  // Expand each target to candidate files.
  let files = [];
  for (const t of opts.targets) {
    const abs = resolve(t);
    if (!existsSync(abs)) { console.error(`not found: ${t}`); process.exit(2); }
    files.push(...collectTargets(abs));
  }
  files = [...new Set(files)];
  if (files.length === 0) { console.error('no .html files found at target(s).'); process.exit(2); }

  const reports = [];
  let worst = 100;
  for (const file of files) {
    const agg = scoreFile(file);
    const rel = relative(process.cwd(), file) || file;
    const report = buildReport(rel, agg, opts.min);
    reports.push(report);
    worst = Math.min(worst, agg.total);
    if (!opts.json && !opts.quiet) {
      console.log(renderScorecard(rel, agg, opts.min));
    }
  }

  const out = reports.length === 1 ? reports[0] : { tool: 'cinematic-doctor', version: 1, threshold: opts.min, lowestTotal: worst, pass: worst >= opts.min, reports };
  const reportPath = join(__dirname, 'cinematic-report.json');
  writeFileSync(reportPath, JSON.stringify(out, null, 2) + '\n');

  if (opts.json) {
    console.log(JSON.stringify(out, null, 2));
  } else if (!opts.quiet) {
    console.log(`  report → ${relative(process.cwd(), reportPath) || reportPath}`);
    if (reports.length > 1) {
      console.log(`  lowest total across ${reports.length} files: ${worst}/100 → ${worst >= opts.min ? 'PASS' : 'FAIL'}`);
    }
  }

  process.exit(worst >= opts.min ? 0 : 1);
}

main();
