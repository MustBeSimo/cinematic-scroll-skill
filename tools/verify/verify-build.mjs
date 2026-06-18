#!/usr/bin/env node
/**
 * verify-build.mjs — Phase 5: one command, one exit code, one report.
 *
 * Composes the project's gates so an agent can prove a phase in a single call instead of
 * remembering five tools. Static contract checks always run; a build target adds the doctor;
 * --runtime adds page-proof; --mode-b adds typecheck + next build.
 *
 *   node tools/verify/verify-build.mjs [target.html|dir] [--phase build|polish]
 *        [--min N] [--runtime] [--mode-b <dir>] [--fast] [--json] [--report <path>]
 *
 * Exit 0 = every NON-optional step passed. Optional steps that can't run (no browser, no
 * node_modules) report SKIP and don't fail the build unless --strict. Zero dependencies.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODE = process.execPath;

// ---- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
// Positional target: first non-flag token, correctly skipping value-taking flags' values
// (a naive argv.find mis-fires when the target string equals a flag's value).
const VALUE_FLAGS = new Set(["--min", "--mode-b", "--report", "--phase"]);
let target = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) { if (VALUE_FLAGS.has(a)) i++; continue; }
  target = a; break;
}
const phase = val("phase", "build");
const fast = flag("fast");
const strict = flag("strict");
const runtime = flag("runtime") || phase === "polish";
const minScore = Number(val("min", phase === "polish" ? 85 : 80));
const modeB = val("mode-b");

// ---- step runner --------------------------------------------------------
const steps = [];
function run(name, args, { optional = false, cwd = ROOT } = {}) {
  const r = spawnSync(NODE, args, { cwd, encoding: "utf8" });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  const lastLine = out.split("\n").filter(Boolean).pop() || "";
  const ok = r.status === 0;
  steps.push({ name, ok, code: r.status, optional, detail: lastLine.slice(0, 160) });
  return ok;
}
function runCmd(name, cmd, args, { optional = false, cwd = ROOT } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  const ok = r.status === 0;
  steps.push({ name, ok, code: r.status, optional, detail: (out.split("\n").filter(Boolean).pop() || "").slice(0, 160) });
  return ok;
}
function skip(name, why) { steps.push({ name, ok: true, code: null, optional: true, skipped: true, detail: why }); }

// ---- 1. static contract (always) ---------------------------------------
run("tokens:check", [join(ROOT, "tools/check-tokens.mjs")]);
run("themes:check", [join(ROOT, "tools/check-themes.mjs")]);
run("links:check", [join(ROOT, "tools/check-links.mjs")]);

// ---- 2. resolve target html --------------------------------------------
let html = null;
if (target) {
  const t = join(ROOT, target);
  if (existsSync(t) && statSync(t).isDirectory()) {
    const idx = join(t, "index.html");
    html = existsSync(idx) ? idx : null;
  } else if (existsSync(t)) html = t;
  if (!html) steps.push({ name: "resolve-target", ok: false, code: 2, detail: `no html at ${target}` });
}

// ---- 3. doctor (if html) -----------------------------------------------
if (html) run(`doctor (min ${minScore})`, [join(ROOT, "tools/cinematic-doctor/cli.mjs"), html, "--min", String(minScore), "--quiet"]);

// ---- 4. runtime page-proof (optional) ----------------------------------
if (html && runtime && !fast) {
  const browser = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!existsSync(join(ROOT, "node_modules", "playwright-core"))) skip("page-proof", "playwright-core not installed");
  else run("page-proof", [join(ROOT, "tools/page-proof/proof.mjs"), html, "--out", join(ROOT, ".verify/proof"), ...(browser ? ["--browser", browser] : [])], { optional: true });
} else if (html && runtime && fast) skip("page-proof", "--fast");

// ---- 5. Mode B (optional) ----------------------------------------------
if (modeB && !fast) {
  const dir = join(ROOT, modeB);
  if (!existsSync(join(dir, "node_modules"))) skip("mode-b typecheck/build", "node_modules not installed — run npm install first");
  else { runCmd("mode-b typecheck", "npm", ["--prefix", dir, "run", "typecheck"], { optional: true, cwd: dir }); runCmd("mode-b build", "npm", ["--prefix", dir, "run", "build"], { optional: true, cwd: dir }); }
} else if (modeB && fast) skip("mode-b", "--fast");

// ---- report -------------------------------------------------------------
const required = steps.filter((s) => !s.optional);
const failed = required.filter((s) => !s.ok);
const report = { phase, target: target || null, minScore, ok: failed.length === 0, steps };

if (flag("json")) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`\n  verify-build · phase=${phase}${target ? ` · ${target}` : " · static only"}`);
  for (const s of steps) {
    const mark = s.skipped ? "○ SKIP" : s.ok ? "✓ PASS" : "✗ FAIL";
    console.log(`   ${mark}  ${s.name}${s.detail ? `  — ${s.detail}` : ""}`);
  }
  console.log(`\n  ${report.ok ? "✓" : "✗"} ${required.length - failed.length}/${required.length} required checks passed${failed.length ? ` · FAILED: ${failed.map((s) => s.name).join(", ")}` : ""}\n`);
}

const reportPath = val("report");
if (reportPath) { mkdirSync(dirname(join(ROOT, reportPath)), { recursive: true }); writeFileSync(join(ROOT, reportPath), JSON.stringify(report, null, 2)); }

process.exit(report.ok || (failed.every((s) => s.optional) && !strict) ? 0 : 1);
