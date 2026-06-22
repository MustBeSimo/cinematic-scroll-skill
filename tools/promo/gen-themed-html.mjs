#!/usr/bin/env node
/**
 * gen-themed-html.mjs — produce one themed copy of a showcase component per theme.
 *
 * The component (default hero-parallax) is 100% var(--*)-driven with an inline :root{}.
 * For each tokens/build/<slug>.vars.css we inject that theme's :root as a trailing <style>
 * so it WINS the cascade (later, same specificity) — themed colors/fonts/easing, identical
 * structure. Output: .promo/html/<slug>.html  (the "one contract → N looks" capture inputs).
 *
 *   node tools/promo/gen-themed-html.mjs [componentPath]
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const component = process.argv[2] || "components/mode-a/hero-parallax.html";
const html = readFileSync(join(ROOT, component), "utf8");
if (!html.includes("</head>")) { console.error("✗ component has no </head>"); process.exit(1); }

const buildDir = join(ROOT, "tokens/build");
const themes = readdirSync(buildDir).filter((f) => f.endsWith(".vars.css")).map((f) => f.replace(".vars.css", ""));
const outDir = join(ROOT, ".promo/html");

let n = 0;
for (const slug of themes) {
  const css = readFileSync(join(buildDir, `${slug}.vars.css`), "utf8");
  const inject = `<style data-promo-theme="${slug}">\n${css}\n</style>\n</head>`;
  const themed = html.replace("</head>", inject);
  writeFileSync(join(outDir, `${slug}.html`), themed);
  n++;
}
console.log(`✓ generated ${n} themed HTML files → .promo/html/  [${themes.join(", ")}]`);
