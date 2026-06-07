#!/usr/bin/env node
/* ============================================================================
   compile-choreography.mjs
   The signature mechanic, made real: compiles a `scroll-choreography.json`
   (declarative scroll → camera-move schema) into runnable GSAP ScrollTrigger +
   Lenis code. No build step, no deps — plain Node ESM.

   Usage:
     node compile-choreography.mjs <choreography.json> [--out scene.js] [--html]
     node compile-choreography.mjs --example          # compile the bundled example
     node compile-choreography.mjs <file> --html      # also emit a runnable demo HTML

   What it does (mirrors scroll-choreography-compilation.md):
     1. Parse + validate the choreography object
     2. Emit Lenis smooth-scroll init (forwarded to ScrollTrigger)
     3. Per chapter: a pinned ScrollTrigger timeline with layer parallax,
        title reveal, atmosphere/color morph, and velocity nodes
     4. Transitions between chapters
     5. A reduced-motion guard that no-ops the timeline

   The single most important job: map the schema's CSS-style property names
   (translateX/translateY/rotateZ…) to GSAP's shorthand (x/y/rotation…),
   because GSAP silently ignores the CSS names. That mapping lives in ONE place
   below and is the reason this compiler exists.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ---- the one mapping that matters: schema (CSS) → GSAP shorthand ---------- */
const GSAP_PROP = {
  translateX: 'x', translateY: 'y', translateZ: 'z',
  rotateX: 'rotationX', rotateY: 'rotationY', rotateZ: 'rotation',
  scale: 'scale', opacity: 'opacity',
  // passthroughs that GSAP accepts as-is:
  letterSpacing: 'letterSpacing', backgroundColor: 'backgroundColor',
};
const gprop = (p) => GSAP_PROP[p] ?? p;
const withUnit = (v, unit) => (unit && typeof v === 'number' ? `${v}${unit}` : v);

/* ---- tiny validation (enough to fail loudly, not a full JSON-Schema run) -- */
function validate(doc) {
  const errs = [];
  if (!doc || typeof doc !== 'object') errs.push('root is not an object');
  if (!Array.isArray(doc.chapters) || !doc.chapters.length)
    errs.push('`chapters` must be a non-empty array');
  (doc.chapters || []).forEach((c, i) => {
    if (!c.id) errs.push(`chapters[${i}] missing id`);
    if (!Array.isArray(c.layers) || !c.layers.length)
      errs.push(`chapters[${i}].layers must be a non-empty array`);
  });
  if (errs.length) throw new Error('Invalid choreography:\n  - ' + errs.join('\n  - '));
  return doc;
}

/* GSAP accepts cubic-bezier via CustomEase, but named eases are safer in raw
   output. Pass cubic-beziers straight through as a string GSAP can register;
   map a few common ones to named eases for portability. */
function mapEase(e) {
  if (!e) return undefined;
  const named = {
    'cubic-bezier(0.16, 1, 0.3, 1)': 'power3.out',
    'cubic-bezier(0.7, 0, 0.84, 0)': 'power3.in',
    'cubic-bezier(0.87, 0, 0.13, 1)': 'power4.inOut',
    'cubic-bezier(0.34, 1.56, 0.64, 1)': 'back.out(1.4)',
  };
  return named[e] || e; // GSAP-named eases (power3.out etc.) pass through
}

/* ---- compile one chapter to a GSAP block ---------------------------------- */
function compileChapter(ch, globals) {
  const sel = `[data-chapter='${ch.id}']`;
  const pin = ch.pin || {};
  const pinDur = pin.pinDuration ?? 200;
  // scrub comes from the chapter's first-layer trigger, NOT the Lenis lerp
  // (globals.scrollSmoothing). Default 0.5 per performance-budget ScrollTrigger.defaults.
  const firstTrigger = ch.layers?.[0]?.animation?.trigger || {};
  const scrub = firstTrigger.scrub ?? 0.5;
  // anticipatePin: GSAP wants a small numeric hint. Map from pin.anticipatorySettle
  // (0.0–0.15 fraction); default 1 when unspecified.
  const anticipatePin = pin.anticipatorySettle ?? 1;
  const lines = [];
  lines.push(`  /* ── Chapter: ${ch.id}  (pattern: ${ch.pattern || 'custom'}) ── */`);
  lines.push(`  {`);
  lines.push(`    const tl = gsap.timeline({`);
  lines.push(`      scrollTrigger: {`);
  lines.push(`        trigger: "${sel}",`);
  lines.push(`        start: "top top",`);
  lines.push(`        end: "+=${pinDur}vh",`);
  lines.push(`        scrub: ${scrub},`);
  lines.push(`        pin: ${pin.enabled !== false},`);
  lines.push(`        pinSpacing: ${pin.pinSpacing !== false},`);
  lines.push(`        anticipatePin: ${anticipatePin},`);
  lines.push(`        fastScrollEnd: ${firstTrigger.fastScrollEnd ?? true},`);
  lines.push(`        invalidateOnRefresh: true,`);
  lines.push(`      },`);
  lines.push(`    });`);

  // layers → parallax tweens, positioned at 0 so they scrub together
  (ch.layers || []).forEach((layer) => {
    const lsel = `${sel} [data-layer='${layer.id}']`;
    const props = layer.animation?.properties || [];
    if (!props.length) return;
    const tween = {};
    const fromTween = {};
    let hasFrom = false;
    props.forEach((p) => {
      const g = gprop(p.property);
      tween[g] = withUnit(p.to, p.unit);
      if (p.from !== undefined) { fromTween[g] = withUnit(p.from, p.unit); hasFrom = true; }
    });
    const dur = layer.animation?.duration ?? 1;
    const easing = mapEase(props[0]?.easing || globals.defaultEasing);
    const willChange = layer.willChange ? `, willChange: "transform"` : '';
    if (hasFrom) {
      lines.push(`    tl.fromTo("${lsel}", ${json(fromTween)}, { ${spread(tween)}, ease: ${q(easing)}, duration: ${dur}${willChange} }, 0);`);
    } else {
      lines.push(`    tl.to("${lsel}", { ${spread(tween)}, ease: ${q(easing)}, duration: ${dur}${willChange} }, 0);`);
    }
  });

  // title reveal
  if (ch.titleReveal) {
    lines.push(...compileTitleReveal(ch.titleReveal, sel, globals));
  }

  // atmosphere / colour morph
  if (ch.atmosphere?.colorMorph) {
    const m = ch.atmosphere.colorMorph;
    lines.push(`    tl.to("${sel}", { backgroundColor: ${q(m.to)}, ease: "none", duration: 1 }, ${m.scrollStart ?? 0});`);
  } else if (ch.atmosphere?.backgroundColor) {
    lines.push(`    gsap.set("${sel}", { backgroundColor: ${q(ch.atmosphere.backgroundColor)} });`);
  }

  // velocity nodes → ScrollTrigger onUpdate reacting to getVelocity()
  if (Array.isArray(ch.velocityNodes) && ch.velocityNodes.length) {
    lines.push(...compileVelocity(ch.velocityNodes, sel));
  }

  lines.push(`  }`);
  return lines.join('\n');
}

function compileTitleReveal(t, sel, globals) {
  const tsel = `${sel} [data-title]`;
  const r = t.scrollRange || { start: 0, end: 0.4 };
  const ease = q(mapEase(t.easing || globals.defaultEasing));
  const at = r.start ?? 0;
  const dur = Math.max(0.1, (r.end ?? 0.4) - (r.start ?? 0));
  const L = [];
  L.push(`    /* title: ${t.type} */`);
  switch (t.type) {
    case 'maskReveal':
    case 'clipPathWipe':
      L.push(`    tl.fromTo("${tsel}", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    case 'verticalMask':
      L.push(`    tl.fromTo("${tsel}", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    case 'wordStagger':
    case 'splitLineRise':
      L.push(`    tl.fromTo("${tsel} .w", { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: ${t.stagger?.offset ?? 0.06}, ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    case 'letterStagger':
    case 'typewriterReveal':
      L.push(`    tl.fromTo("${tsel} .c", { autoAlpha: 0 }, { autoAlpha: 1, stagger: ${t.stagger?.offset ?? 0.02}, ease: "none", duration: ${dur} }, ${at});`);
      break;
    case 'letterSpacingScrub':
      L.push(`    tl.fromTo("${tsel}", { letterSpacing: "0.4em", autoAlpha: 0.4 }, { letterSpacing: "0em", autoAlpha: 1, ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    case 'scaleDownEntrance':
      L.push(`    tl.fromTo("${tsel}", { scale: 1.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    case 'blurCrossfade':
      // never animate filter; crossfade two stacked copies (taste-guardrails §1.1)
      L.push(`    tl.fromTo("${tsel} .sharp", { autoAlpha: 0 }, { autoAlpha: 1, ease: ${ease}, duration: ${dur} }, ${at});`);
      L.push(`    tl.to("${tsel} .soft", { autoAlpha: 0, ease: ${ease}, duration: ${dur} }, ${at});`);
      break;
    default:
      L.push(`    tl.fromTo("${tsel}", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, ease: ${ease}, duration: ${dur} }, ${at});`);
  }
  return L;
}

function compileVelocity(nodes, sel) {
  const tsel = `${sel} [data-title]`;
  const L = [];
  L.push(`    /* velocity-reactive typography */`);
  L.push(`    ScrollTrigger.create({`);
  L.push(`      trigger: "${sel}", start: "top bottom", end: "bottom top",`);
  L.push(`      onUpdate: (self) => {`);
  L.push(`        const v = Math.abs(self.getVelocity()) / 1000;`);
  nodes.forEach((n) => {
    const cmp = n.comparison === 'below' ? '<' : '>';
    const s = n.above || {};
    const lerp = n.lerpFactor ?? 0.1;
    const set = Object.entries(s).map(([k, val]) => `${gprop(k)}: ${typeof val === 'string' ? q(val) : val}`).join(', ');
    const base = n.below || {};
    const reset = Object.entries(base).map(([k, val]) => `${gprop(k)}: ${typeof val === 'string' ? q(val) : val}`).join(', ');
    L.push(`        if (v ${cmp} ${n.threshold}) { gsap.to("${tsel}", { ${set}, duration: ${lerp}, overwrite: "auto" }); }`);
    if (reset) L.push(`        else { gsap.to("${tsel}", { ${reset}, duration: ${lerp}, overwrite: "auto" }); }`);
  });
  L.push(`      },`);
  L.push(`    });`);
  return L;
}

function compileTransition(t) {
  const TYPE = {
    craneShot:  { y: -100, rotationX: 4 },
    whipPan:    { x: '-100vw' },
    matchCut:   { autoAlpha: 0 },
    dissolve:   { autoAlpha: 0, scale: 0.97 },
    pushIn:     { scale: 1.08 },
    hardCut:    {},
  };
  const move = TYPE[t.type] || {};
  const ease = q(mapEase(t.easing || 'power4.inOut'));
  const set = Object.entries(move).map(([k, v]) => `${k}: ${typeof v === 'string' ? q(v) : v}`).join(', ');
  if (t.type === 'hardCut' || !set) {
    return `  /* transition ${t.from} → ${t.to}: hard cut (no tween) */`;
  }
  return [
    `  /* transition ${t.from} → ${t.to}: ${t.type} */`,
    `  gsap.timeline({ scrollTrigger: { trigger: "[data-chapter='${t.to}']", start: "top bottom", end: "top top", scrub: true } })`,
    `    .to("[data-chapter='${t.from}']", { ${set}, ease: ${ease} }, 0);`,
  ].join('\n');
}

/* ---- helpers -------------------------------------------------------------- */
const q = (s) => (s === undefined ? 'undefined' : JSON.stringify(s));
const json = (o) => JSON.stringify(o);
const spread = (o) => Object.entries(o).map(([k, v]) => `${k}: ${typeof v === 'string' ? q(v) : v}`).join(', ');

/* ---- top-level emit ------------------------------------------------------- */
function compile(doc) {
  validate(doc);
  const g = doc.globals || {};
  const out = [];
  out.push(`/* AUTO-GENERATED by compile-choreography.mjs — do not edit by hand. */`);
  out.push(`/* Source choreography: ${doc.metadata?.name || 'unnamed'} */`);
  out.push(`import { gsap } from "gsap";`);
  out.push(`import { ScrollTrigger } from "gsap/ScrollTrigger";`);
  out.push(`import Lenis from "lenis";`);
  out.push(`gsap.registerPlugin(ScrollTrigger);`);
  out.push(``);
  out.push(`export function initChoreography() {`);
  out.push(`  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;`);
  out.push(`  if (reduce) { /* ${g.reducedMotionFallback || 'static'} fallback: skip all motion */ return; }`);
  out.push(``);
  out.push(`  /* smooth scroll → ScrollTrigger */`);
  out.push(`  const lenis = new Lenis({ lerp: ${g.scrollSmoothing ?? 0.1} });`);
  out.push(`  lenis.on("scroll", ScrollTrigger.update);`);
  out.push(`  gsap.ticker.add((t) => lenis.raf(t * 1000));`);
  out.push(`  gsap.ticker.lagSmoothing(0);`);
  out.push(`  gsap.defaults({ ease: ${q(mapEase(g.defaultEasing) || 'power3.out')}, duration: ${g.defaultDuration ?? 1} });`);
  out.push(``);
  (doc.chapters || []).forEach((ch) => out.push(compileChapter(ch, g)));
  if (Array.isArray(doc.transitions)) {
    out.push(``);
    doc.transitions.forEach((t) => out.push(compileTransition(t)));
  }
  out.push(``);
  out.push(`  ScrollTrigger.refresh();`);
  out.push(`}`);
  return out.join('\n');
}

/* ============================================================================
   VIDEO TARGET — one choreography, two media.
   The same document that compiles to a scroll-driven page (above) compiles to a
   fixed-time paused GSAP timeline for video renderers (HyperFrames, Remotion).

   Time mapping (FRAME.md §5 pacing rules):
     • scroll pace: PACE seconds per 100vh of pinDuration (default 1.2 —
       taste-guardrails §3.1), then clamped to [4s, 14s] scene dwell.
     • in-chapter scroll fractions (titleReveal.scrollRange etc.) multiply the
       scene's duration and offset from the scene start.
   Dropped on purpose: Lenis/ScrollTrigger (no scroll), velocity nodes (no
   scroll velocity in fixed time), reduced-motion guard (a render is a film).
   The DOM contract is unchanged: [data-chapter='id'] scenes containing
   [data-layer='id'] and [data-title] — one HTML skeleton serves both targets.
   ========================================================================== */

const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

function sceneSeconds(ch, pace) {
  const vh = ch.pin?.pinDuration ?? 200;
  return clampN((vh / 100) * pace, 4, 14);
}

function videoChapter(ch, globals, t0, dur) {
  const sel = `[data-chapter='${ch.id}']`;
  const L = [];
  L.push(`  /* ── Scene: ${ch.id} — ${t0.toFixed(1)}s → ${(t0 + dur).toFixed(1)}s (pattern: ${ch.pattern || 'custom'}) ── */`);
  // scene enter / exit (the "cut")
  L.push(`  tl.fromTo("${sel}", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power3.out" }, ${t0.toFixed(2)});`);
  L.push(`  tl.to("${sel}", { autoAlpha: 0, duration: 0.5, ease: "power3.in" }, ${(t0 + dur - 0.5).toFixed(2)});`);

  // layers: scroll parallax becomes a timed drift across the scene
  (ch.layers || []).forEach((layer) => {
    const lsel = `${sel} [data-layer='${layer.id}']`;
    const props = layer.animation?.properties || [];
    if (!props.length) return;
    const tween = {}; const fromTween = {}; let hasFrom = false;
    props.forEach((p) => {
      const gp = gprop(p.property);
      tween[gp] = withUnit(p.to, p.unit);
      if (p.from !== undefined) { fromTween[gp] = withUnit(p.from, p.unit); hasFrom = true; }
    });
    const ease = mapEase(props[0]?.easing || globals.defaultEasing) || 'none';
    const at = (t0 + dur * 0.05).toFixed(2);
    const d = (dur * 0.9).toFixed(2);
    if (hasFrom) L.push(`  tl.fromTo("${lsel}", ${json(fromTween)}, { ${spread(tween)}, ease: ${q(ease)}, duration: ${d} }, ${at});`);
    else L.push(`  tl.to("${lsel}", { ${spread(tween)}, ease: ${q(ease)}, duration: ${d} }, ${at});`);
  });

  // title reveal: scroll fractions → seconds within the scene
  if (ch.titleReveal) {
    const t = ch.titleReveal;
    const r = t.scrollRange || { start: 0.08, end: 0.45 };
    const at = (t0 + dur * (r.start ?? 0.08)).toFixed(2);
    const d = Math.max(0.4, dur * ((r.end ?? 0.45) - (r.start ?? 0.08))).toFixed(2);
    const ease = q(mapEase(t.easing || globals.defaultEasing) || 'power3.out');
    const tsel = `${sel} [data-title]`;
    switch (t.type) {
      case 'wordStagger': case 'splitLineRise':
        L.push(`  tl.fromTo("${tsel} .w", { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: ${t.stagger?.offset ?? 0.08}, ease: ${ease}, duration: ${d} }, ${at});`);
        break;
      case 'letterSpacingScrub':
        L.push(`  tl.fromTo("${tsel}", { letterSpacing: "0.4em", autoAlpha: 0.4 }, { letterSpacing: "0em", autoAlpha: 1, ease: ${ease}, duration: ${d} }, ${at});`);
        break;
      case 'maskReveal': case 'clipPathWipe':
        L.push(`  tl.fromTo("${tsel}", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: ${ease}, duration: ${d} }, ${at});`);
        break;
      case 'verticalMask':
        L.push(`  tl.fromTo("${tsel}", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: ${ease}, duration: ${d} }, ${at});`);
        break;
      case 'scaleDownEntrance':
        L.push(`  tl.fromTo("${tsel}", { scale: 1.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: ${ease}, duration: ${d} }, ${at});`);
        break;
      default:
        L.push(`  tl.fromTo("${tsel}", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: ${ease}, duration: ${d} }, ${at});`);
    }
  }

  // atmosphere: colour morph becomes a timed background tween on the stage
  if (ch.atmosphere?.colorMorph) {
    const m = ch.atmosphere.colorMorph;
    L.push(`  tl.to("#stage, ${sel}", { backgroundColor: ${q(m.to)}, ease: "none", duration: ${(dur * 0.5).toFixed(2)} }, ${(t0 + dur * (m.scrollStart ?? 0.2)).toFixed(2)});`);
  } else if (ch.atmosphere?.backgroundColor) {
    L.push(`  tl.set("${sel}", { backgroundColor: ${q(ch.atmosphere.backgroundColor)} }, ${t0.toFixed(2)});`);
  }

  if (Array.isArray(ch.velocityNodes) && ch.velocityNodes.length) {
    L.push(`  /* velocityNodes skipped — scroll velocity does not exist in fixed-time video */`);
  }
  return L.join('\n');
}

function compileVideo(doc, { pace = 1.2 } = {}) {
  validate(doc);
  const g = doc.globals || {};
  const id = doc.metadata?.id || 'main';
  const chapters = doc.chapters || [];
  // scene schedule: sequential, durations from pacing rules
  let t = 0;
  const schedule = chapters.map((ch) => {
    const dur = sceneSeconds(ch, pace);
    const entry = { ch, t0: t, dur };
    t += dur;
    return entry;
  });
  const total = Math.ceil(t * 10) / 10;

  const out = [];
  out.push(`/* AUTO-GENERATED by compile-choreography.mjs --target video — do not edit by hand. */`);
  out.push(`/* Source choreography: ${doc.metadata?.name || 'unnamed'} · ${chapters.length} scenes · ${total}s total */`);
  out.push(`/* Dual-use output:`);
  out.push(`   • HyperFrames: load via <script type="module">; registers window.__timelines["${id}"].`);
  out.push(`     Set data-duration="${total}" on the composition root.`);
  out.push(`   • Remotion: import { buildChoreographyTimeline } and seek per frame:`);
  out.push(`       const tl = useMemo(() => buildChoreographyTimeline(gsap), []);`);
  out.push(`       useEffect(() => { tl.seek(frame / fps); }, [frame]);  */`);
  out.push(``);
  out.push(`export const CHOREOGRAPHY_DURATION = ${total}; // seconds`);
  out.push(``);
  out.push(`export function buildChoreographyTimeline(gsap) {`);
  out.push(`  const tl = gsap.timeline({ paused: true });`);
  out.push(``);
  schedule.forEach(({ ch, t0, dur }) => out.push(videoChapter(ch, g, t0, dur)));
  out.push(``);
  out.push(`  tl.set({}, {}, ${total}); /* pin composition duration */`);
  out.push(`  return tl;`);
  out.push(`}`);
  out.push(``);
  out.push(`/* HyperFrames auto-registration (no-op outside the browser) */`);
  out.push(`if (typeof window !== "undefined" && window.gsap) {`);
  out.push(`  window.__timelines = window.__timelines || {};`);
  out.push(`  window.__timelines[${q(id)}] = buildChoreographyTimeline(window.gsap);`);
  out.push(`}`);
  return out.join('\n');
}

/* ============================================================================
   PREVIEW HARNESS (--harness) — "watch it move" in one command, no install.
   Emits a self-contained HTML file: a skeleton DOM generated from the
   choreography document (placeholder layers, real title text), GSAP from CDN,
   the compiled video timeline inlined, and play / scrub controls.
   The same [data-chapter]/[data-layer]/[data-title] contract as production —
   so what you preview is what the real targets will animate.
   ========================================================================== */

const PLACEHOLDER_COLORS = ['#1E3A3E', '#5A2328', '#8F6A38', '#31475A', '#202A31', '#6B2C2C', '#2E4057'];

function harnessSkeleton(doc, pace) {
  const chapters = doc.chapters || [];
  return chapters.map((ch, ci) => {
    const dark = !!(ch.atmosphere?.backgroundColor && parseInt((ch.atmosphere.backgroundColor || '#888').slice(1, 3), 16) < 0x60);
    const ink = dark ? '#E9E1D4' : '#1E2326';
    const layers = (ch.layers || []).map((l, li) => {
      const col = PLACEHOLDER_COLORS[li % PLACEHOLDER_COLORS.length];
      const d = l.depth ?? 0.5;
      const size = 18 + Math.round(d * 30); // deeper layers read bigger
      return `      <div data-layer="${l.id}" class="ph" style="background:${col};width:${size}%;height:${size + 8}%;left:${8 + li * 13}%;top:${14 + li * 11}%">
        <span>${l.id} · d${d}</span>
      </div>`;
    }).join('\n');
    const titleText = ch.titleReveal?.text || ch.title || ch.id;
    const words = String(titleText).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    return `    <section data-chapter="${ch.id}" style="background:${ch.atmosphere?.backgroundColor || '#101417'};color:${ink}">
${layers}
      <h1 data-title>${words}</h1>
      <div class="meta">${ch.id} · ${ch.pattern || 'custom'} · scene ${ci + 1}/${chapters.length}</div>
    </section>`;
  }).join('\n');
}

/* ============================================================================
   HYPERFRAMES TARGET (--target hyperframes) — a COMPLETE render-ready
   composition: describe → compile → `npx hyperframes render` → MP4.
   Renders the choreography's REAL content (image/text/svg layers from
   Layer.content) in a default collage layout. The schema carries no geometry —
   positioning is design work; the emitted file marks every layer for layout
   editing while the timeline (transform/opacity only) keeps working untouched.
   ========================================================================== */

function contentEl(l, ink) {
  const c = l.content || {};
  const d = l.depth ?? 0.5;
  const base = `position:absolute;border-radius:6px;overflow:hidden;`;
  if (c.type === 'image' && c.src) {
    // background-image: a missing asset degrades to the tint, never a broken icon
    return `<div data-cs-layer="${l.id}" role="img" aria-label="${c.alt || l.id}" style="${base}background:#88888822 url('${c.src}') center/cover no-repeat;"></div>`;
  }
  if (c.type === 'text') {
    const fs = c.fontSize || (d >= 0.9 ? '20px' : '15px');
    const txt = c.text || l.id.replace(/[-_]/g, ' ').toUpperCase();
    return `<div data-cs-layer="${l.id}" style="${base}font-family:'Space Mono',monospace;font-size:${fs};letter-spacing:.18em;color:${ink};display:flex;align-items:center;">${txt}</div>`;
  }
  if (c.type === 'svg' && typeof c.src === 'string' && c.src.trim().startsWith('<svg')) {
    return `<div data-cs-layer="${l.id}" style="${base}">${c.src}</div>`;
  }
  // svg fragments / video / unknown → quiet gradient panel (no dev labels)
  return `<div data-cs-layer="${l.id}" style="${base}background:linear-gradient(135deg,#8888881f,#88888840);"></div>`;
}

function hyperframesSkeleton(doc) {
  return (doc.chapters || []).map((ch) => {
    const dark = !!(ch.atmosphere?.backgroundColor && parseInt((ch.atmosphere.backgroundColor || '#888').slice(1, 3), 16) < 0x60);
    const ink = dark ? '#E9E1D4' : '#1E2326';
    const layers = (ch.layers || []).map((l, li) => {
      const d = l.depth ?? 0.5;
      const size = 22 + Math.round(d * 26);
      // default collage layout — EDIT ME: position for your design
      const el = contentEl(l, ink);
      return el.replace('style="', `style="width:${size}%;height:${size + 10}%;left:${6 + li * 12}%;top:${10 + li * 10}%;`);
    }).join('\n      ');
    const titleText = ch.titleReveal?.text || ch.id;
    const words = String(titleText).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    return `    <!-- chapter: ${ch.id} — LAYOUT IS YOURS: reposition the [data-layer] elements
         freely; the timeline animates transform/opacity only, so any layout works. -->
    <section data-chapter="${ch.id}" style="position:absolute;inset:0;background:${ch.atmosphere?.backgroundColor || '#101417'};color:${ink};visibility:hidden;opacity:0;">
      ${layers}
      <h1 data-title style="position:absolute;left:70px;bottom:90px;max-width:68%;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:88px;line-height:1.04;">${words}</h1>
    </section>`;
  }).join('\n');
}

function compileHyperframes(doc, { pace = 1.2 } = {}) {
  // HyperFrames reserves `data-layer` for its own runtime (track system) —
  // rename our layer attribute to `data-cs-layer` in BOTH skeleton and timeline
  // so the contract stays matched without colliding with the renderer.
  const timelineCode = compileVideo(doc, { pace })
    .replace(/^export const CHOREOGRAPHY_DURATION/m, 'const CHOREOGRAPHY_DURATION')
    .replace(/^export function buildChoreographyTimeline/m, 'function buildChoreographyTimeline')
    .replaceAll("[data-layer='", "[data-cs-layer='");
  const id = doc.metadata?.id || 'main';
  const name = doc.metadata?.name || 'choreography';
  // total duration must match the timeline — recompute identically
  let t = 0;
  (doc.chapters || []).forEach((ch) => { t += sceneSeconds(ch, pace); });
  const total = Math.ceil(t * 10) / 10;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <!-- AUTO-GENERATED by compile-choreography.mjs --target hyperframes.
         Render: npx hyperframes render   (in a HyperFrames project; see
         video/ship-in-5/ for project files). Preview: npx hyperframes preview. -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; }
      [data-title] .w { display: inline-block; margin-right: .22em; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${id}" data-start="0" data-duration="${total}"
         data-width="1920" data-height="1080" style="position:relative;width:1920px;height:1080px;overflow:hidden;">
<!-- ${name} · ${total}s · compiled from scroll-choreography.json -->
${hyperframesSkeleton(doc)}
    </div>
    <script>
${timelineCode}
      window.__timelines = window.__timelines || {};
      window.__timelines["${id}"] = buildChoreographyTimeline(gsap);
    </script>
  </body>
</html>`;
}

function compileHarness(doc, { pace = 1.2 } = {}) {
  const timelineCode = compileVideo(doc, { pace })
    .replace(/^export const CHOREOGRAPHY_DURATION/m, 'const CHOREOGRAPHY_DURATION')
    .replace(/^export function buildChoreographyTimeline/m, 'function buildChoreographyTimeline');
  const name = doc.metadata?.name || 'choreography';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${name} — choreography preview</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0c0e; font-family:ui-monospace,Menlo,monospace; overflow:hidden; }
  /* bulletproof scaling: stage is fixed-centered, then translate+scale in one
     transform — works at any window size, never overflows oddly */
  #stage { position:fixed; left:50%; top:calc((100vh - 64px) / 2);
           width:1920px; height:1080px; overflow:hidden;
           background:#101417; transform-origin:center;
           transform:translate(-50%,-50%) scale(.5);
           box-shadow:0 20px 80px rgba(0,0,0,.6); }
  #stage section { position:absolute; inset:0; visibility:hidden; opacity:0; padding:90px; }
  .ph { position:absolute; border-radius:6px; opacity:.85; display:grid; place-items:end start; }
  .ph span { font-size:15px; color:#fffc; padding:8px 10px; }
  [data-title] { position:absolute; left:90px; bottom:140px; font-size:104px; line-height:1.02;
                 font-family:Georgia,serif; text-transform:uppercase; letter-spacing:.01em; max-width:70%; }
  [data-title] .w { display:inline-block; margin-right:.22em; }
  .meta { position:absolute; right:90px; bottom:60px; font-size:16px; opacity:.55; letter-spacing:.18em; text-transform:uppercase; }
  #bar { position:fixed; left:0; right:0; bottom:0; height:64px; display:flex; gap:14px;
         align-items:center; padding:0 18px; background:#14181c; border-top:1px solid #232a30; }
  #play { width:84px; height:36px; background:#8F6A38; color:#101417; border:0; border-radius:4px;
          font:700 13px/1 ui-monospace,monospace; letter-spacing:.1em; cursor:pointer; }
  #scrub { flex:1; accent-color:#8F6A38; }
  #clock { color:#E9E1D4; font-size:13px; min-width:110px; text-align:right; }
</style>
</head>
<body>
<div id="stage">
${harnessSkeleton(doc, pace)}
</div>
<div id="bar">
  <button id="play">PLAY</button>
  <input id="scrub" type="range" min="0" max="1000" value="0" />
  <div id="clock">0.0s / 0.0s</div>
</div>
<script>
${timelineCode}
const tl = buildChoreographyTimeline(gsap);
const total = CHOREOGRAPHY_DURATION;
/* fit 1920x1080 stage into the window — translate-center + scale, any size */
function fit(){ const s = Math.min((innerWidth-32)/1920, (innerHeight-96)/1080);
  document.getElementById('stage').style.transform =
    'translate(-50%,-50%) scale(' + Math.max(s, 0.05) + ')'; }
addEventListener('resize', fit); fit();
/* controls */
const play = document.getElementById('play'), scrub = document.getElementById('scrub'), clock = document.getElementById('clock');
let playing = false;
function sync(){ scrub.value = Math.round(tl.progress()*1000);
  clock.textContent = tl.time().toFixed(1) + 's / ' + total + 's'; }
gsap.ticker.add(sync);
play.addEventListener('click', () => {
  playing = !playing; play.textContent = playing ? 'PAUSE' : 'PLAY';
  if (playing) { if (tl.progress() >= 1) tl.progress(0); tl.play(); } else tl.pause();
});
tl.eventCallback('onComplete', () => { playing = false; play.textContent = 'PLAY'; });
scrub.addEventListener('input', () => { tl.pause(); playing = false; play.textContent = 'PLAY';
  tl.progress(scrub.value/1000); });
</script>
</body>
</html>`;
}

/* ---- CLI ------------------------------------------------------------------ */
function main() {
  const args = process.argv.slice(2);
  let src = args.find((a) => !a.startsWith('--'));
  if (args.includes('--example') || !src) {
    src = join(__dirname, 'scroll-choreography.json');
  }
  if (!existsSync(src)) { console.error(`✗ not found: ${src}`); process.exit(1); }

  let doc = JSON.parse(readFileSync(src, 'utf8'));
  // a schema file stores its real choreography under examples[0]
  if (doc.$schema && Array.isArray(doc.examples) && doc.examples.length) {
    console.error(`note: ${basename(src)} is a schema — compiling examples[0] ("${doc.examples[0].metadata?.name || 'example'}")`);
    doc = doc.examples[0];
  }

  const tArg = args.indexOf('--target');
  const target = tArg >= 0 ? args[tArg + 1] : 'web';
  const pArg = args.indexOf('--pace');
  const pace = pArg >= 0 ? parseFloat(args[pArg + 1]) : 1.2;

  let code;
  if (args.includes('--harness')) code = compileHarness(doc, { pace });
  else if (target === 'video') code = compileVideo(doc, { pace });
  else if (target === 'hyperframes') code = compileHyperframes(doc, { pace });
  else if (target === 'web') code = compile(doc);
  else { console.error(`✗ unknown --target "${target}" (use: web | video | hyperframes, or --harness for a preview HTML)`); process.exit(1); }

  const label = args.includes('--harness') ? 'harness' : target;
  const outArg = args.indexOf('--out');
  const outPath = outArg >= 0 ? args[outArg + 1] : null;
  if (outPath) { writeFileSync(outPath, code); console.error(`✓ [${label}] wrote ${outPath} (${code.split('\n').length} lines)`); }
  else { process.stdout.write(code + '\n'); }
}

main();
