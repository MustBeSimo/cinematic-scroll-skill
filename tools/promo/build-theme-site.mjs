#!/usr/bin/env node
/**
 * build-theme-site.mjs [slug...] — generate CINEMATIC, token-driven example sites, one per theme.
 *
 * Each site is a self-contained Mode-A page that consumes ONLY the semantic token vars (a theme
 * is one inlined CSS swap) and carries the skill's full motion grammar: a pinned, scrubbed hero
 * with a Ken-Burns push-in, multi-depth parallax, kinetic word/line type reveals, clip-path media
 * wipes, scroll-driven 3D tilt, velocity skew, and a scroll-progress bar — all via GSAP +
 * ScrollTrigger (pinned CDN + SRI). Degrades gracefully: no GSAP → vanilla rAF reveals/parallax;
 * prefers-reduced-motion → fully static. A distinct brand voice + the fal.ai hero image per theme
 * makes them read as 11 different worlds, not 11 recolors.
 * Output: examples/<slug>/index.html  +  examples/<slug>/hero.jpg
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

// GSAP + ScrollTrigger — pinned CDN + SRI (same versions as the hand-crafted examples).
const GSAP = `<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" integrity="sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" integrity="sha384-P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh" crossorigin="anonymous"></script>`;

// split a string into per-word spans (kinetic mask reveal). Newlines → separate masked lines.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const words = (str) =>
  str.split("\n").map((line) =>
    `<span class="ln"><span class="ln-i">${line.split(" ").map((w) => `<span class="wd">${esc(w)}</span>`).join(" ")}</span></span>`
  ).join("");

function page(slug, c, themeCss) {
  const chapters = c.chapters.map(([label, head, body], i) => `
    <section class="chapter" data-scene>
      <div class="chap-media tilt" data-skew><img src="hero.jpg" alt="" loading="lazy"></div>
      <div class="chap-copy">
        <div class="chap-num" aria-hidden="true">0${i + 1}</div>
        <div class="eyebrow accent">${esc(label)}</div>
        <h2 class="kinetic">${words(head)}</h2>
        <p>${esc(body)}</p>
      </div>
    </section>`).join("");
  const features = c.features.map(([t, d]) => `<div class="feat"><div class="feat-rule"></div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${c.brand} — ${slug} · cinematic-scroll v2.5.1</title>
${FONTS}
${GSAP}
<style>
/* ── design tokens (theme: ${slug}) ── */
${themeCss}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font-family:var(--font-body,Georgia,serif);line-height:var(--lh-relaxed,1.6);-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:var(--accent);color:var(--bg)}
:focus-visible{outline:2px solid var(--accent);outline-offset:4px;border-radius:2px}
.eyebrow{font-family:var(--font-ui,Inter,sans-serif);font-size:var(--size-caption,.8rem);letter-spacing:.28em;text-transform:uppercase;color:var(--fg-dim,#666)}
h1,h2,h3{font-family:var(--font-display,Georgia,serif);line-height:var(--lh-tight,1.04);font-weight:700}
.accent{color:var(--accent)}
.wrap{max-width:1240px;margin:0 auto;padding:0 6vw}
/* kinetic type — each word rides up out of a clipped line */
.ln{display:block;overflow:hidden;padding-bottom:.04em}
.wd{display:inline-block;will-change:transform}
/* scroll-progress bar */
.progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:50;background:transparent}
.progress span{display:block;height:100%;width:100%;transform:scaleX(0);transform-origin:0 50%;background:var(--accent);will-change:transform}
/* nav */
nav{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:22px 6vw;mix-blend-mode:difference;color:#fff}
nav .mark{font-family:var(--font-ui,Inter,sans-serif);font-weight:700;letter-spacing:.18em;font-size:.92rem}
nav .menu{font-family:var(--font-ui,Inter,sans-serif);font-size:.78rem;letter-spacing:.12em;opacity:.85;text-transform:uppercase}
@media(max-width:640px){nav .menu{display:none}}
/* hero — pinned, scrubbed, multi-depth */
.hero{position:relative;height:100vh}
.hero-pin{position:relative;height:100vh;overflow:hidden;perspective:1400px}
.hero-tilt{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}
.hero-bg{position:absolute;inset:-6%}
.hero-bg img{width:100%;height:100%;object-fit:cover;transform:scale(1.04);will-change:transform}
.hero-grade{position:absolute;inset:0;opacity:.55;will-change:opacity;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 30%,transparent) 0%,transparent 30%,color-mix(in srgb,var(--bg) 55%,transparent) 70%,var(--bg) 100%)}
.hero-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 100% at 50% 38%,transparent 55%,color-mix(in srgb,var(--bg) 70%,transparent) 100%)}
.hero-inner{position:absolute;left:0;right:0;bottom:9vh;z-index:2;will-change:transform,opacity}
.hero .eyebrow{color:var(--accent);margin-bottom:1.5rem;display:block}
.hero h1{font-size:var(--fluid-h1,clamp(3rem,9vw,8rem));letter-spacing:-.025em;color:var(--fg);text-shadow:0 2px 50px color-mix(in srgb,var(--bg) 55%,transparent)}
.scroll-cue{margin-top:2.4rem;font-family:var(--font-ui,Inter,sans-serif);font-size:.72rem;letter-spacing:.3em;text-transform:uppercase;color:var(--fg-dim,#888);display:flex;align-items:center;gap:.8rem}
.scroll-cue i{display:block;width:1px;height:34px;background:linear-gradient(var(--accent),transparent);animation:cue 2.2s var(--ease-reveal,cubic-bezier(.65,0,.35,1)) infinite;transform-origin:top}
@keyframes cue{0%,100%{transform:scaleY(.3);opacity:.4}50%{transform:scaleY(1);opacity:1}}
/* statement — big line, per-word reveal */
.statement{min-height:92vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:18vh 6vw}
.statement h2{font-size:clamp(2.1rem,5.4vw,4.8rem);max-width:20ch;letter-spacing:-.015em}
.statement .rule{width:80px;height:3px;background:var(--accent);margin-top:3rem;transform:scaleX(0);transform-origin:0 50%;will-change:transform}
/* chapters — clip-wipe media, ghost number, tilt */
.chapter{position:relative;display:grid;grid-template-columns:1.02fr .98fr;gap:6vw;align-items:center;padding:16vh 6vw;max-width:1340px;margin:0 auto;perspective:1200px}
.chapter:nth-child(even){direction:rtl}.chapter:nth-child(even)>*{direction:ltr}
.chap-media{position:relative;border-radius:var(--radius-lg,14px);overflow:hidden;aspect-ratio:4/5;transform-style:preserve-3d;will-change:transform;box-shadow:0 50px 110px color-mix(in srgb,var(--fg) 26%,transparent)}
.chap-media img{width:100%;height:100%;object-fit:cover;transform:scale(1.06);will-change:transform}
.chap-copy{position:relative}
.chap-num{position:absolute;top:-12vh;right:0;font-family:var(--font-ui,Inter,sans-serif);font-weight:700;font-size:clamp(7rem,16vw,15rem);line-height:.8;color:transparent;-webkit-text-stroke:1px color-mix(in srgb,var(--fg) 16%,transparent);pointer-events:none;will-change:transform;z-index:-1}
.chap-copy h2{font-size:clamp(1.9rem,3.6vw,3.2rem);margin:1rem 0 1.3rem}
.chap-copy p{font-size:var(--size-body-lg,1.18rem);color:var(--fg-dim,#666);max-width:42ch}
/* features */
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:2.6rem;padding:14vh 6vw 16vh;max-width:1340px;margin:0 auto}
.feat-rule{width:44px;height:3px;background:var(--accent);margin-bottom:1.6rem;transform:scaleX(0);transform-origin:0 50%;will-change:transform}
.feat h3{font-size:1.65rem;margin-bottom:.7rem}
.feat p{color:var(--fg-dim,#666)}
/* cta */
.cta{min-height:86vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 6vw;border-top:1px solid var(--line,rgba(0,0,0,.12))}
.cta h2{font-size:clamp(2.6rem,7vw,6rem);letter-spacing:-.025em;max-width:16ch}
.cta .mark{margin-top:3rem;font-family:var(--font-ui,Inter,sans-serif);letter-spacing:.22em;font-size:.9rem;color:var(--fg-dim,#888)}
/* film grain */
.grain{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:.05;mix-blend-mode:overlay}
@media (max-width:820px){.chapter,.features{grid-template-columns:1fr}.chapter:nth-child(even){direction:ltr}.chap-num{top:-9vh}}
/* progressive enhancement: with no JS / reduced-motion everything is visible + still */
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .wd{transform:none!important}
  .statement .rule,.feat-rule,.progress span{transform:scaleX(1)!important}
  .hero-tilt,.chap-media{transform:none!important}
  .scroll-cue i{animation:none}
}
</style></head>
<body>
<div class="progress" aria-hidden="true"><span></span></div>
<nav><div class="mark">${c.brand}</div><div class="menu">${c.kicker}</div></nav>
<header class="hero" data-scene>
  <div class="hero-pin">
    <div class="hero-tilt"><div class="hero-bg"><img src="hero.jpg" alt="${c.brand} — ${c.kicker}"></div></div>
    <div class="hero-grade"></div>
    <div class="hero-vig"></div>
    <div class="hero-inner wrap">
      <span class="eyebrow">${esc(c.kicker)}</span>
      <h1 class="kinetic">${words(c.title)}</h1>
      <div class="scroll-cue"><i></i>Scroll</div>
    </div>
  </div>
</header>
<main>
<section class="statement" data-scene><h2 class="kinetic">${words(c.statement)}</h2><div class="rule"></div></section>
${chapters}
<section class="features" data-scene>${features}</section>
<section class="cta" data-scene><h2 class="kinetic">${words(c.cta)}</h2><div class="mark">${c.brand} · built with cinematic-scroll</div></section>
</main>
<footer style="padding:6vh 6vw;border-top:1px solid var(--line,rgba(0,0,0,.12));font-family:var(--font-ui,Inter,sans-serif);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-dim,#888);display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem">
  <span>${c.brand}</span><span>By Simone Leonelli · built with cinematic-scroll</span>
</footer>
<svg class="grain" width="100%" height="100%" aria-hidden="true"><filter id="gn"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#gn)"/></svg>
<script>
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch  = matchMedia('(hover: none)').matches;
  var canPin = !touch && innerWidth > 820;

  // ── reduced-motion: nothing animates, everything already visible (CSS handles it) ──
  if (reduce) return;

  function start(){
    if (window.gsap && window.ScrollTrigger) return cinematic();
    return fallback();           // CDN blocked → vanilla reveals + parallax
  }

  // ── full cinematic engine (GSAP + ScrollTrigger) ──────────────────────────────
  function cinematic(){
    var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
    var ST = window.ScrollTrigger;
    ST.defaults({ scrub: 0.6 });

    // scroll-progress bar
    gsap.to('.progress span', { scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.25 } });

    // HERO — Ken-Burns push-in + grade deepen + copy lift, pinned (desktop only)
    var heroBg = document.querySelector('.hero-bg img');
    if (canPin) {
      var htl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=85%', pin: '.hero-pin', scrub: 0.6, anticipatePin: 1 } });
      htl.to(heroBg, { scale: 1.2, ease: 'none', duration: 1 }, 0)
         .to('.hero-grade', { opacity: 1, ease: 'none', duration: 1 }, 0)
         // copy lifts out and is fully gone by ~38% of the pin — long before the statement enters
         .to('.hero-inner', { yPercent: -46, opacity: 0, ease: 'power1.in', duration: 0.34 }, 0.04);
    } else {
      gsap.to(heroBg, { scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }
    // hero title intro on load
    gsap.from('.hero h1 .wd', { yPercent: 118, duration: 1.1, ease: 'power4.out', stagger: 0.06, delay: 0.15 });
    gsap.from('.hero .eyebrow', { opacity: 0, yPercent: 60, duration: 1, ease: 'power3.out', delay: 0.05 });
    gsap.from('.scroll-cue', { opacity: 0, duration: 1, delay: 0.9 });

    // STATEMENT — words rise, accent rule draws
    gsap.from('.statement .wd', { yPercent: 118, duration: 0.95, ease: 'power3.out', stagger: 0.035,
      scrollTrigger: { trigger: '.statement', start: 'top 72%', toggleActions: 'play none none none' } });
    gsap.fromTo('.statement .rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: '.statement', start: 'top 62%' } });

    // CHAPTERS — clip-wipe media, scrubbed image scale, ghost-number parallax, kinetic copy
    gsap.utils.toArray('.chapter').forEach(function(ch){
      var media = ch.querySelector('.chap-media');
      var img = ch.querySelector('.chap-media img');
      var num = ch.querySelector('.chap-num');
      gsap.fromTo(media, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: ch, start: 'top 78%' } });
      gsap.fromTo(img, { scale: 1.28 }, { scale: 1.0, ease: 'none',
        scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 0.7 } });
      gsap.from(ch.querySelectorAll('.chap-copy .wd'), { yPercent: 118, duration: 0.9, ease: 'power3.out', stagger: 0.03,
        scrollTrigger: { trigger: ch, start: 'top 72%' } });
      gsap.from(ch.querySelectorAll('.eyebrow, .chap-copy p'), { opacity: 0, y: 26, duration: 0.9, ease: 'power2.out', stagger: 0.1,
        scrollTrigger: { trigger: ch, start: 'top 70%' } });
      if (num) gsap.fromTo(num, { yPercent: 28 }, { yPercent: -34, ease: 'none',
        scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });

    // FEATURES — staggered rise + rule draw
    gsap.from('.feat', { y: 64, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.features', start: 'top 80%' } });
    gsap.fromTo('.feat-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out', stagger: 0.12,
      scrollTrigger: { trigger: '.features', start: 'top 80%' } });

    // CTA — big line reveal
    gsap.from('.cta .wd', { yPercent: 118, duration: 1.1, ease: 'power4.out', stagger: 0.04,
      scrollTrigger: { trigger: '.cta', start: 'top 76%' } });

    // ── rAF: 3D tilt (pointer) + velocity skew, owns .tilt/.hero-tilt transforms ──
    var tiltEls = [].slice.call(document.querySelectorAll('.tilt, .hero-tilt'));
    var px = 0, py = 0, tx = 0, ty = 0, vel = 0, tvel = 0, lastY = scrollY;
    if (!touch) addEventListener('pointermove', function(e){ px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
    ST.create({ onUpdate: function(self){ tvel = Math.max(-9, Math.min(9, self.getVelocity() / -260)); } });
    function loop(){
      tx += (px - tx) * 0.06; ty += (py - ty) * 0.06; vel += (tvel - vel) * 0.12; tvel *= 0.9;
      for (var i = 0; i < tiltEls.length; i++){
        var el = tiltEls[i], hero = el.classList.contains('hero-tilt');
        var rx = (hero ? -ty * 2.2 : -ty * 1.4), ry = (hero ? tx * 2.6 : tx * 1.8);
        el.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) skewY(' + (el.classList.contains('hero-tilt') ? 0 : vel).toFixed(2) + 'deg)';
      }
      requestAnimationFrame(loop);
    }
    if (!touch) requestAnimationFrame(loop);
    addEventListener('load', function(){ ST.refresh(); });
  }

  // ── graceful fallback (no GSAP): IO reveals + light rAF parallax ────────────────
  function fallback(){
    document.querySelectorAll('.wd').forEach(function(w){ w.style.transform = 'translateY(118%)'; });
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return;
      e.target.querySelectorAll('.wd').forEach(function(w,i){ w.style.transition = 'transform .9s ' + (i*0.03) + 's cubic-bezier(.16,1,.3,1)'; w.style.transform = 'none'; });
      var r = e.target.querySelector('.rule, .feat-rule'); if(r){ r.style.transition='transform 1s ease'; r.style.transform='scaleX(1)'; }
      io.unobserve(e.target);
    }); }, { threshold: 0.2 });
    document.querySelectorAll('[data-scene], .feat').forEach(function(s){ io.observe(s); });
    var imgs = [].slice.call(document.querySelectorAll('.hero-bg img, .chap-media img'));
    var prog = document.querySelector('.progress span'), tick = false;
    function frame(){ tick = false; var vh = innerHeight, max = document.documentElement.scrollHeight - vh;
      if (prog) prog.style.transform = 'scaleX(' + (max>0?scrollY/max:0).toFixed(3) + ')';
      imgs.forEach(function(img){ var r = img.parentElement.getBoundingClientRect(); var p = (r.top + r.height/2 - vh/2)/vh; img.style.transform = 'scale(1.06) translateY(' + (p*-6).toFixed(2) + '%)'; });
    }
    addEventListener('scroll', function(){ if(!tick){ tick=true; requestAnimationFrame(frame); } }, { passive: true }); frame();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', function(){ setTimeout(start, 0); });
  else start();
})();
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
  const themeCss = readFileSync(cssPath, "utf8").replace(/\/\*[^]*?\*\//, "").trim();
  const dir = join(ROOT, "examples", slug);
  mkdirSync(dir, { recursive: true });
  if (existsSync(heroPath)) copyFileSync(heroPath, join(dir, "hero.jpg"));
  else if (!existsSync(join(dir, "hero.jpg"))) { console.error(`missing hero image: ${slug} (generate first)`); continue; }
  writeFileSync(join(dir, "index.html"), page(slug, c, themeCss));
  console.log(`✓ examples/${slug}/  (${c.brand})`);
}
