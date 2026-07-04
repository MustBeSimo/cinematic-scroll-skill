#!/usr/bin/env node
/* build-leaderboard.mjs — render bench/results/*.json into the static leaderboard page.
   Zero deps. Unmeasurable sites are footnoted, never ranked. Page must pass the doctor ≥90. */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escUrl = (u) => (/^https?:\/\//i.test(String(u)) ? esc(u) : "#");

export function buildHtml(results) {
  const ranked = results.filter((r) => r.scores && typeof r.scores.overall === "number").sort((a, b) => b.scores.overall - a.scores.overall || String(a.name).localeCompare(String(b.name)));
  const unmeasurable = results.filter((r) => !(r.scores && typeof r.scores.overall === "number"));
  const cats = [...new Set(ranked.map((r) => r.category))].sort();
  const bv = (results.find((r) => r.bench_version) || {}).bench_version || "unknown";
  const bvs = [...new Set(results.map((r) => r.bench_version).filter(Boolean))];
  const dates = results.map((r) => String(r.ts || "").slice(0, 10)).filter(Boolean).sort();
  const bar = (v, label) => { const n = Math.max(0, Math.min(100, Math.round(Number(v) || 0))); return `<div class="dim" title="${esc(label)}: ${n}"><span class="fill" style="--v:${n}%"></span><em>${n}</em></div>`; };
  const rows = ranked.map((r, i) => `      <tr data-cat="${esc(r.category)}">
        <td class="rank">${i + 1}</td>
        <td class="site"><a href="${escUrl(r.url)}" rel="noopener nofollow" target="_blank">${esc(r.name)}</a><small>${esc(r.category)}</small></td>
        <td>${bar(r.scores.pacing, "Pacing")}</td><td>${bar(r.scores.performance, "Performance")}</td>
        <td>${bar(r.scores.a11y, "Motion A11y (heuristic)")}</td><td>${bar(r.scores.motionCraft, "Motion Craft")}</td>
        <td class="overall">${r.scores.overall}</td>
      </tr>`).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CinematicBench — how the web's best scroll experiences actually score</title>
<meta name="description" content="A reproducible, passive benchmark of scroll craft: pacing, performance, accessibility, motion craft. Scored 0-100. Score your own site with one command.">
<style>
  :root{--bg:#0c0d10;--panel:#14161b;--ink:#e8e6df;--dim:#8b8f98;--accent:#c9a962;--good:#7dc98f;--bad:#d97b6c;--line:#2a2d34;--track:#1c1f25}
  @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
  *{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--ink);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif;padding:0 24px 96px}
  header{max-width:1080px;margin:64px auto 40px}h1{font-size:clamp(28px,5vw,56px);line-height:1.08;letter-spacing:-.02em}
  h1 em{color:var(--accent);font-style:normal}header p{color:var(--dim);max-width:640px;margin-top:16px}
  .cta{display:inline-block;margin-top:20px;padding:10px 16px;background:var(--panel);border:1px solid var(--line);border-radius:8px;color:var(--accent);font:600 14px ui-monospace,monospace}
  nav{max-width:1080px;margin:0 auto 16px;display:flex;gap:8px;flex-wrap:wrap}
  nav button{background:var(--panel);color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:600 13px inherit;cursor:pointer;transition:color .25s cubic-bezier(.22,.61,.36,1),background-color .25s cubic-bezier(.22,.61,.36,1)}
  nav button[aria-pressed="true"]{color:var(--bg);background:var(--accent);border-color:var(--accent)}
  a:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
  .site a{transition:color .25s cubic-bezier(.22,.61,.36,1)}.site a:hover{color:var(--accent)}
  table{width:100%;max-width:1080px;margin:0 auto;border-collapse:collapse}
  th{color:var(--dim);font:600 12px/1 inherit;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:12px 10px;border-bottom:1px solid var(--line)}
  td{padding:14px 10px;border-bottom:1px solid var(--track);vertical-align:middle}
  .rank{color:var(--dim);font:600 14px ui-monospace,monospace}.site a{color:var(--ink);text-decoration:none;font-weight:600}.site small{display:block;color:var(--dim)}
  .dim{position:relative;width:88px;height:8px;background:var(--track);border-radius:4px}
  .dim .fill{position:absolute;inset:0;width:var(--v);background:linear-gradient(90deg,var(--bad),var(--good));border-radius:4px}
  .dim em{position:absolute;right:-2px;top:10px;font:600 11px ui-monospace,monospace;color:var(--dim);font-style:normal}
  .overall{font:700 20px ui-monospace,monospace;color:var(--accent)}
  footer{max-width:1080px;margin:48px auto 0;color:var(--dim);font-size:13px}footer a{color:var(--accent)}
  /* Mobile: single readable column — rank · site · overall; dimension bars are desktop detail.
     No motion on this page, so touch-safety = layout, not animation branches. */
  @media (max-width: 720px){
    body{padding:0 12px 64px}
    header{margin:40px auto 24px}
    th:nth-child(n+3):nth-child(-n+6),td:nth-child(n+3):nth-child(-n+6){display:none}
    th,td{padding:10px 6px}
    .overall{font-size:17px}
  }
</style></head><body>
<header>
  <h1>Cinematic<em>Bench</em> — how the web's best scroll experiences actually score</h1>
  <p>A reproducible, passive benchmark of scroll craft — pacing, performance, accessibility, motion craft — measured with one ordinary page load and a standard scroll. Median of 3 runs. No opinions, one rubric.</p>
  <a class="cta" href="https://github.com/MustBeSimo/cinematic-scroll-skill/tree/main/tools/bench">npx -p cinematic-scroll-skill cinematic-bench https://your-site.com</a>
</header>
<nav aria-label="category filter"><button aria-pressed="true" data-cat="all">All</button>${cats.map((c) => `<button aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</nav>
<table><thead><tr><th scope="col">#</th><th scope="col">Site</th><th scope="col">Pacing</th><th scope="col">Perf</th><th scope="col">Motion&nbsp;A11y*</th><th scope="col">Craft</th><th scope="col">Overall</th></tr></thead><tbody>
${rows}
</tbody></table>
<footer>
  <p>measured ${esc(dates[0] || "n/a")}${dates.length > 1 && dates.at(-1) !== dates[0] ? "–" + esc(dates.at(-1)) : ""} · headless Chromium (hardware GL) · 1440×900 · bench_version ${esc(bv)}${bvs.length > 1 ? " (mixed versions!)" : ""} · ${ranked.length} sites ranked · ${unmeasurable.length} unmeasurable (bot-wall / robots / timeout — listed in the repo, never guessed) · <a href="https://github.com/MustBeSimo/cinematic-scroll-skill/tree/main/tools/bench">methodology</a> · built with <a href="https://github.com/MustBeSimo/cinematic-scroll-skill">cinematic-scroll-skill</a> · part of <a href="../stack/">the taste stack</a> · *Motion A11y is an automated heuristic (reduced-motion honored, focus visibility, sampled contrast) — not a WCAG conformance assessment.</p>
</footer>
<script>
  for (const b of document.querySelectorAll("nav button")) b.addEventListener("click", () => {
    for (const x of document.querySelectorAll("nav button")) x.setAttribute("aria-pressed", x === b ? "true" : "false");
    for (const tr of document.querySelectorAll("tbody tr")) tr.style.display = (b.dataset.cat === "all" || tr.dataset.cat === b.dataset.cat) ? "" : "none";
  });
</script>
</body></html>\n`;
}

function loadResults() {
  const dir = join(HERE, "results");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

function selftest() {
  const fx = (n, o, cat) => ({ bench_version: "1.0", name: n, url: "https://x.test/" + n, category: cat, scores: o === null ? null : { pacing: o, performance: o, a11y: o, motionCraft: o, overall: o }, unmeasurable_reason: o === null ? "bot-wall" : null });
  const html = buildHtml([fx("low", 50, "editorial"), fx("high", 90, "dev-tools"), fx("blocked", null, "editorial")]);
  const ok = (c, m) => { if (!c) { console.error("✗ leaderboard selftest: " + m); process.exit(1); } };
  ok(html.indexOf(">high<") < html.indexOf(">low<"), "ranking order (high first)");
  ok(!/>blocked</.test(html), "unmeasurable must not be ranked");
  ok(/1 unmeasurable/.test(html), "unmeasurable footnote count");
  ok(/bench_version 1.0/.test(html), "bench_version in footer");
  ok(/measured /.test(html), "footer must carry the measurement date");
  ok(/not a WCAG conformance assessment/.test(html), "a11y heuristic disclaimer present");
  ok(/scope="col"/.test(html), "th scope");
  ok(/prefers-reduced-motion/.test(html), "leaderboard must honor reduced motion itself");
  const evil = buildHtml([fx("evil", 80, "editorial")].map((r) => ({ ...r, url: "javascript:alert(1)", scores: { ...r.scores, pacing: '80" onmouseover="alert(1)' } })));
  ok(!/javascript:alert/.test(evil), "javascript: url must be neutralized");
  ok(!/onmouseover/.test(evil), "string sub-score must not inject markup");
  const partial = buildHtml([fx("ok", 70, "editorial"), { bench_version: "1.0", name: "weird", url: "https://x.test/w", category: "editorial", scores: { overall: null }, unmeasurable_reason: null }]);
  ok(/1 unmeasurable/.test(partial) && !/>weird</.test(partial), "invalid-scores record counts as unmeasurable, not ranked");
  console.log("✓ leaderboard selftest: ranks, excludes unmeasurable, footnotes, versioned, escapes.");
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv.includes("--selftest")) selftest();
  const results = loadResults();
  if (!results.length) { console.error("✗ build-leaderboard: no results in bench/results/ — run the corpus first (see tools/bench/README.md)"); process.exit(1); }
  writeFileSync(join(HERE, "index.html"), buildHtml(results));
  console.log(`✓ build-leaderboard: wrote bench/index.html (${results.filter((r) => r.scores).length} ranked)`);
  process.exit(0);
}
