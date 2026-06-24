#!/usr/bin/env node
/**
 * check-consistency.mjs — Phase 12 invariant: catch drift that the per-phase gates don't.
 *
 *   1. VERSION SYNC      package.json === manifest.json === SKILL.md frontmatter === .claude-plugin/plugin.json
 *   2. SECRET SCAN       no tracked *.env.local (only *.example may be tracked)
 *   3. KEY PATHS         the foundation files the docs promise actually exist
 *   4. TOKEN DETERMINISM committed tokens/build/variables.css matches a fresh build
 *
 * Exit 0 = consistent. Zero npm deps (uses git + node only). Wired into `npm test` + CI.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

// 1. version sync — package.json, manifest.json, AND the SKILL.md frontmatter (the
//    canonical version a skill registry like ClawHub reads). All three must agree.
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const man = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
if (pkg.version !== man.version) errors.push(`version drift: package.json ${pkg.version} ≠ manifest.json ${man.version}`);
const skillFm = readFileSync(join(ROOT, "SKILL.md"), "utf8").split(/^---\s*$/m)[1] || "";
const skillVer = (skillFm.match(/^version:\s*(.+?)\s*$/m) || [])[1];
if (!skillVer) errors.push("SKILL.md frontmatter has no `version:` field");
else if (skillVer !== pkg.version) errors.push(`version drift: SKILL.md frontmatter ${skillVer} ≠ package.json ${pkg.version}`);
// the Claude Code plugin manifest is a 4th install surface — keep it in the triad (now a quad)
const PLUGIN = join(ROOT, ".claude-plugin/plugin.json");
if (existsSync(PLUGIN)) {
  const plug = JSON.parse(readFileSync(PLUGIN, "utf8"));
  if (plug.version !== pkg.version) errors.push(`version drift: .claude-plugin/plugin.json ${plug.version} ≠ package.json ${pkg.version}`);
}

// 2. secret scan (tracked .env.local) — git required; skip with notice if absent
const ls = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
if (ls.status === 0) {
  const ALLOW = /\.(example|sample|template)$/;
  const leaked = ls.stdout.split("\n").filter((f) => f && /(^|\/)\.env($|\.)/.test(f) && !ALLOW.test(f));
  for (const f of leaked) errors.push(`tracked secret-bearing file: ${f} (gitignore it; only .env*.example/.sample/.template may be tracked)`);
} else {
  console.log("  (git unavailable — skipping secret scan)");
}

// 3. key paths the docs promise
for (const p of ["design.md", "tokens/core.tokens.json", "tokens/motion.tokens.json", "tokens/semantic.tokens.json",
  "tokens/build/variables.css", "themes/theme-contract.md", "components/manifest.json",
  "references/component-grammar.md", "references/design-tokens.md"]) {
  if (!existsSync(join(ROOT, p))) errors.push(`promised path missing: ${p}`);
}

// 3b. installer payload must ship the design system — npx install would otherwise
//     deliver a skill missing the v2.4.0 surfaces SKILL.md routes to.
const installer = readFileSync(join(ROOT, "bin/install.mjs"), "utf8");
// Every top-level surface SKILL.md routes to must be in the npx PAYLOAD — incl. tools/
// (the cinematic-doctor quality gate) and the 3D/film hand-offs. A miss = an install whose
// SKILL.md references files that aren't there.
for (const surface of ["design.md", "tokens", "themes", "components", "references", "templates",
                       "examples", "tools", "ASSETS-3D.md", "FRAME.md", "MODELS.md"]) {
  if (!new RegExp(`['"]${surface.replace(".", "\\.")}['"]`).test(installer)) {
    errors.push(`installer (bin/install.mjs) PAYLOAD is missing '${surface}' — npx install would ship an incomplete skill (SKILL.md routes to it)`);
  }
}

// 4. token build determinism — committed output must equal a fresh build
const before = existsSync(join(ROOT, "tokens/build/variables.css")) ? readFileSync(join(ROOT, "tokens/build/variables.css"), "utf8") : null;
const build = spawnSync(process.execPath, [join(ROOT, "tools/build-tokens/build.mjs")], { cwd: ROOT, encoding: "utf8" });
if (build.status !== 0) errors.push(`build:tokens failed: ${(build.stderr || "").trim().split("\n").pop()}`);
else {
  const after = readFileSync(join(ROOT, "tokens/build/variables.css"), "utf8");
  if (before !== null && before !== after) errors.push("tokens/build/variables.css is stale — run `npm run build:tokens` and commit the result");
}

if (errors.length) {
  console.error(`✗ check-consistency: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ check-consistency: version ${pkg.version} in sync (package.json · manifest.json · SKILL.md · plugin.json), no tracked secrets, foundation paths present, token build deterministic.`);
process.exit(0);
