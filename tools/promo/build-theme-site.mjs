#!/usr/bin/env node
/**
 * build-theme-site.mjs [slug...] — generate rich, token-driven example sites, one per theme.
 *
 * Each site is a self-contained Mode-A page that consumes ONLY the semantic token vars, so a
 * theme is one inlined CSS swap. A distinct brand identity + the fal.ai hero image per theme
 * makes them read as 11 different sites, not 11 recolors. Scroll-reveal + hero parallax are
 * vanilla JS (capturable). Output: examples/<slug>/index.html  +  examples/<slug>/hero.jpg
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// per-theme brand identity + copy (distinct voices)
const CONTENT = {
  "symmetric-monument": {brand: "MERIDIAN", kicker: "Institute of Permanence", title: "The art of\nstanding still.", statement: "Some things are built to outlast the people who made them.", chapters: [["01 — Mass", "Weight as meaning", "Symmetry is not decoration. It is the argument that nothing here is accidental — every axis answers another."], ["02 — Stone", "Cut to remain", "Material chosen for the century, not the season. The grain is the signature."]], features: [["Permanence", "Designed to age, not expire."], ["Symmetry", "Balance you feel before you see."], ["Restraint", "One accent. Nothing wasted."]], cta: "Build something that lasts."},
  "clinical-noir": {brand: "VANTA LABS", kicker: "Precision Systems", title: "Clarity, in\nthe dark.", statement: "The best instruments disappear. You only notice the result.", chapters: [["01 — Signal", "Noise removed", "Cold light, exact tolerances, zero ornament. What remains is only what works."], ["02 — Method", "Measured, not guessed", "Every surface is a decision. Every shadow is intentional."]], features: [["Precision", "Engineered to the micron."], ["Control", "Nothing left to chance."], ["Focus", "One light. One subject."]], cta: "See it clearly."},
  "storybook-geometry": {brand: "POLLY & PLOT", kicker: "A Studio for Curious Things", title: "Stories\nwith edges.", statement: "Hard shapes, soft ideas — a world assembled from primary joy.", chapters: [["01 — Shapes", "Bold by design", "Circles, squares, and the confidence to leave them be."], ["02 — Play", "Serious fun", "Geometry you can hold, colour you can hear."]], features: [["Playful", "Joy is a design principle."], ["Bold", "Flat, bright, unafraid."], ["Crafted", "Simple is the hard part."]], cta: "Make something delightful."},
  "temporal-monument": {brand: "OBSIDIAN", kicker: "Horology & Architecture", title: "Time, made\nmonumental.", statement: "Built in shadow, finished in gold — a tower for the hours.", chapters: [["01 — Depth", "Seven layers down", "Chiaroscuro is the medium; the eye falls through plane after plane."], ["02 — Glow", "Tungsten patience", "Warmth earned against the black. Nothing arrives quickly."]], features: [["Depth", "Built in seven planes."], ["Drama", "Light against the dark."], ["Scale", "Monumental by intent."]], cta: "Enter the monument."},
  "atmospheric-sublime": {brand: "FARSIGHT", kicker: "Expeditions in Light", title: "Distance is\nthe point.", statement: "Vast, quiet, and slow — the sublime asks you to wait for it.", chapters: [["01 — Haze", "Air as subject", "Warm dust, cold steel, and the immense space between them."], ["02 — Reveal", "Glacial, then sudden", "Patience rewarded — the figure resolves from the fog."]], features: [["Vastness", "Negative space as luxury."], ["Atmosphere", "Light you can almost breathe."], ["Patience", "Reveals, never rushes."]], cta: "Go further out."},
  "warm-scrapbook": {brand: "KEEPSAKE", kicker: "Memory, Pressed", title: "Summers you\ncan hold.", statement: "Sun-faded, hand-placed, lovingly imperfect — a season kept.", chapters: [["01 — Found", "The affectionate archive", "Photographs that lean, corners that curl, warmth that stays."], ["02 — Place", "By hand", "Nothing aligned to a grid. Everything aligned to feeling."]], features: [["Warm", "Found-summer palette."], ["Personal", "Imperfect on purpose."], ["Tactile", "Paper you can feel."]], cta: "Keep the moment."},
  "naturalistic-drift": {brand: "DRIFT", kicker: "Slow Outdoors", title: "Move at the\npace of light.", statement: "Gentle, observed, unhurried — the day handled with care.", chapters: [["01 — Morning", "Light through leaves", "Soft, organic, real. The camera waits for the moment to arrive."], ["02 — Calm", "Unscripted", "No drama, only attention. Green, beige, breath."]], features: [["Organic", "Grown, not designed."], ["Gentle", "Motion like morning."], ["Honest", "Observed, not staged."]], cta: "Slow down with us."},
  "brutalist-kinetic": {brand: "CONCRETE / ORANGE", kicker: "Industrial Goods", title: "Built,\nnot decorated.", statement: "Raw concrete, one warning stripe, zero apology.", chapters: [["01 — Structure", "Exposed on purpose", "The grid is the ornament. The bolts are the brand."], ["02 — Impact", "Stamped, not eased", "Motion that lands like a press closing. Mechanical, deliberate, loud."]], features: [["Raw", "Concrete and honesty."], ["Kinetic", "Hard, mechanical motion."], ["Bold", "One hazard-orange accent."]], cta: "Engineer it."},
  "liquid-chrome": {brand: "CHROMA", kicker: "Liquid Futures", title: "Premium,\nin motion.", statement: "Molten metal, cold light — a surface that never sits still.", chapters: [["01 — Flow", "No hard edges", "Everything ripples, reflects, re-forms. The site is one continuous pour."], ["02 — Shine", "Chrome on black", "Cyan catching light against the dark. Expensive by physics."]], features: [["Fluid", "Continuous, morphing motion."], ["Reflective", "Light is the material."], ["Future", "Cold, glossy, premium."]], cta: "Pour into the future."},
  "botanical-editorial": {brand: "VERDANT PRESS", kicker: "Independent Publishing", title: "Printed,\npressed, patient.", statement: "Warm paper, deep green, and the rhythm of a turned page.", chapters: [["01 — Leaf", "Pressed and kept", "Botanical plates on uncoated stock — literary, calm, considered."], ["02 — Margin", "Room to read", "Generous space, narrow measure. The page respects you."]], features: [["Literary", "Editorial to the margin."], ["Natural", "Grown palette, warm paper."], ["Patient", "Reads, never shouts."]], cta: "Read something made with care."},
  "data-cinematic": {brand: "SIGNAL", kicker: "Observability, Dramatized", title: "Data with\ngravity.", statement: "A briefing in a darkened room — numbers that mean something.", chapters: [["01 — Readout", "Information as spectacle", "Charts that draw themselves; figures that lock on. Mission-control, cinematic."], ["02 — Precision", "Measured drama", "Deep navy, signal-green glow, tabular certainty."]], features: [["Precise", "Measured to the figure."], ["Luminous", "Data that glows."], ["Authoritative", "Drama with rigour."]], cta: "Make the data matter."},
};

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600&display=swap" rel="stylesheet">`;

function page(slug, c, themeCss) {
  const chapters = c.chapters.map(([label, head, body], i) => `
    <section class="chapter reveal">
      <div class="chap-media" data-parallax><img src="hero.jpg" alt="" loading="lazy"></div>
      <div class="chap-copy">
        <div class="eyebrow">${label}</div>
        <h2>${head}</h2>
        <p>${body}</p>
      </div>
    </section>`).join("");
  const features = c.features.map(([t, d]) => `<div class="feat reveal"><div class="feat-rule"></div><h3>${t}</h3><p>${d}</p></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.brand} — ${slug} · cinematic-scroll v2.4.0</title>
${FONTS}
<style>
/* ── design tokens (theme: ${slug}) ── */
${themeCss}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font-family:var(--font-body,Georgia,serif);line-height:var(--lh-relaxed,1.6);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.eyebrow{font-family:var(--font-ui,Inter,sans-serif);font-size:var(--size-caption,.8rem);letter-spacing:.28em;text-transform:uppercase;color:var(--fg-dim,#666)}
h1,h2,h3{font-family:var(--font-display,Georgia,serif);line-height:var(--lh-tight,1.08);font-weight:700}
.accent{color:var(--accent)}
.wrap{max-width:1200px;margin:0 auto;padding:0 6vw}
/* nav */
nav{position:fixed;top:0;left:0;right:0;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:22px 6vw;mix-blend-mode:difference;color:#fff}
nav .mark{font-family:var(--font-ui,Inter,sans-serif);font-weight:700;letter-spacing:.18em;font-size:.92rem}
nav .menu{font-family:var(--font-ui,Inter,sans-serif);font-size:.78rem;letter-spacing:.12em;opacity:.8;text-transform:uppercase}
/* hero */
.hero{position:relative;height:100vh;display:flex;align-items:flex-end;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0}
.hero-bg img{width:100%;height:118%;object-fit:cover;will-change:transform}
.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 28%,transparent) 0%,transparent 32%,color-mix(in srgb,var(--bg) 86%,transparent) 100%)}
.hero-inner{position:relative;z-index:1;padding-bottom:9vh}
.hero .eyebrow{color:var(--accent);margin-bottom:1.4rem}
.hero h1{font-size:var(--fluid-h1,clamp(3rem,8vw,7rem));letter-spacing:-.02em;white-space:pre-line;color:var(--fg);text-shadow:0 2px 40px color-mix(in srgb,var(--bg) 60%,transparent)}
.scroll-cue{margin-top:2.6rem;font-family:var(--font-ui,Inter,sans-serif);font-size:.72rem;letter-spacing:.3em;text-transform:uppercase;color:var(--fg-dim,#888)}
/* statement */
.statement{padding:24vh 6vw;text-align:center}
.statement h2{font-size:clamp(2rem,4.6vw,4rem);max-width:18ch;margin:0 auto;letter-spacing:-.01em}
.statement .rule{width:64px;height:3px;background:var(--accent);margin:3rem auto 0}
/* chapters */
.chapter{display:grid;grid-template-columns:1.05fr .95fr;gap:6vw;align-items:center;padding:14vh 6vw;max-width:1320px;margin:0 auto}
.chapter:nth-child(even){direction:rtl}.chapter:nth-child(even)>*{direction:ltr}
.chap-media{border-radius:var(--radius-lg,14px);overflow:hidden;aspect-ratio:4/5;box-shadow:0 40px 90px color-mix(in srgb,var(--fg) 22%,transparent)}
.chap-media img{width:100%;height:112%;object-fit:cover;will-change:transform}
.chap-copy h2{font-size:clamp(1.8rem,3.4vw,3rem);margin:1rem 0 1.2rem}
.chap-copy p{font-size:var(--size-body-lg,1.15rem);color:var(--fg-dim,#666);max-width:42ch}
/* features */
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4rem;padding:16vh 6vw;max-width:1320px;margin:0 auto}
.feat-rule{width:40px;height:3px;background:var(--accent);margin-bottom:1.6rem}
.feat h3{font-size:1.6rem;margin-bottom:.7rem}
.feat p{color:var(--fg-dim,#666)}
/* cta */
.cta{min-height:80vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 6vw;border-top:1px solid var(--line,rgba(0,0,0,.1))}
.cta h2{font-size:clamp(2.4rem,6vw,5.5rem);letter-spacing:-.02em;max-width:16ch}
.cta .mark{margin-top:3rem;font-family:var(--font-ui,Inter,sans-serif);letter-spacing:.22em;font-size:.9rem;color:var(--fg-dim,#888)}
/* reveal */
.reveal{opacity:0;transform:translateY(46px);transition:opacity var(--dur-slow,.8s) var(--ease-reveal,cubic-bezier(.16,1,.3,1)),transform var(--dur-slow,.8s) var(--ease-reveal,cubic-bezier(.16,1,.3,1))}
.reveal.in{opacity:1;transform:none}
@media (max-width:820px){.chapter,.features{grid-template-columns:1fr}.chapter:nth-child(even){direction:ltr}}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}*{scroll-behavior:auto}}
</style></head>
<body>
<nav><div class="mark">${c.brand}</div><div class="menu">${c.kicker}</div></nav>
<header class="hero">
  <div class="hero-bg" data-parallax><img src="hero.jpg" alt="${c.brand} hero"></div>
  <div class="hero-inner wrap">
    <div class="eyebrow">${c.kicker}</div>
    <h1>${c.title}</h1>
    <div class="scroll-cue">Scroll ↓</div>
  </div>
</header>
<section class="statement reveal"><h2>${c.statement}</h2><div class="rule"></div></section>
${chapters}
<section class="features">${features}</section>
<section class="cta reveal"><h2>${c.cta}</h2><div class="mark">${c.brand} · built with cinematic-scroll</div></section>
<script>
  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  const px=[...document.querySelectorAll('[data-parallax] img')];
  let ticking=false;
  function frame(){ticking=false;const vh=innerHeight;px.forEach(img=>{const r=img.parentElement.getBoundingClientRect();const p=(r.top+r.height/2-vh/2)/vh;img.style.transform='translateY('+(p*-7)+'%)';});}
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(frame);}},{passive:true});frame();
</script>
</body></html>`;
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CONTENT);
for (const slug of slugs) {
  const c = CONTENT[slug];
  if (!c) { console.error(`no content for ${slug}`); continue; }
  const cssPath = join(ROOT, "tokens/build", `${slug}.vars.css`);
  const heroPath = join(ROOT, ".promo/heroes", `${slug}.jpg`);
  if (!existsSync(cssPath)) { console.error(`missing theme css: ${slug}`); continue; }
  if (!existsSync(heroPath)) { console.error(`missing hero image: ${slug} (generate first)`); continue; }
  const themeCss = readFileSync(cssPath, "utf8").replace(/\/\*[^]*?\*\//, "").trim();
  const dir = join(ROOT, "examples", slug);
  mkdirSync(dir, { recursive: true });
  copyFileSync(heroPath, join(dir, "hero.jpg"));
  writeFileSync(join(dir, "index.html"), page(slug, c, themeCss));
  console.log(`✓ examples/${slug}/  (${c.brand})`);
}
