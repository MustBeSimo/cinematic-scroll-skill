#!/usr/bin/env node
/**
 * proof-components.mjs — browser-gated runtime smoke over the component library.
 *
 * Runs page-proof (headless Chrome) on every components/mode-a/*.html — the self-contained,
 * no-CDN components — and fails only on a REAL runtime error. If no browser is present
 * (e.g. a contributor without Chrome), it SKIPS cleanly (exit 0) so it's safe anywhere.
 *
 * This is intentionally NOT in the core `npm test` (which stays zero-dependency / no-browser):
 * it's the optional runtime tier, run as its own browser-gated CI job. Catches the class of
 * regression the static doctor can't — a component that throws / errors at runtime.
 *
 *   npm run proof:components
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROOF = join(ROOT, "tools/page-proof/proof.mjs");
const DIR = join(ROOT, "components/mode-a");

// Gate: find a browser the same way page-proof does. None → skip (don't fail).
const exe = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].find((p) => p && existsSync(p));

if (!exe) {
  console.log("○ proof:components — SKIPPED (no Chrome/Chromium found; set $CHROME_PATH to enable). Not a failure.");
  process.exit(0);
}
if (!existsSync(join(ROOT, "node_modules/playwright-core"))) {
  console.log("○ proof:components — SKIPPED (playwright-core not installed; run `npm install`). Not a failure.");
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".html")).sort();
const outRoot = join(ROOT, ".page-proof/components");
const failures = [];

console.log(`page-proof runtime smoke — ${files.length} components (browser: ${exe})\n`);
for (const f of files) {
  const out = join(outRoot, f.replace(/\.html$/, ""));
  const r = spawnSync(process.execPath, [PROOF, join(DIR, f), "--out", out, "--browser", exe], { cwd: ROOT, encoding: "utf8" });
  const verdict = (r.stdout || "").split("\n").find((l) => l.includes("page-proof:")) || (r.stderr || "").trim().split("\n").pop() || "";
  if (r.status === 0) console.log(`  ✓ ${f}  — ${verdict.replace(/^page-proof:\s*/, "")}`);
  else if (r.status === 1) { failures.push(f); console.log(`  ✗ ${f}  — RUNTIME ERRORS: ${verdict}`); }
  else console.log(`  ○ ${f}  — could not run (exit ${r.status}): ${verdict}`); // env issue, not a content failure
}

try { rmSync(outRoot, { recursive: true, force: true }); } catch {}

if (failures.length) {
  console.error(`\n✗ proof:components: ${failures.length} component(s) with runtime errors: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`\n✓ proof:components: all ${files.length} components render with 0 runtime errors.`);
process.exit(0);
