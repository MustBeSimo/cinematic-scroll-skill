/* ============================================================================
   checks/performance.mjs — the 60fps contract (references/performance-budget.md).

   Flags:
     • animating non-transform/opacity props on scroll hot paths
       (top/left/width/height/margin/padding) — budget §1 "Forbidden Properties"
       + taste-guardrails §1.6 (layout thrash);
     • > 7 parallax/depth layers in a chapter — taste-guardrails §1.7 / budget §2;
     • render-blocking <script> in <head> without defer/async/module — budget §5
       "Critical JS (blocking) = 0KB";
     • missing devicePixelRatio cap when WebGL present — budget §2 layer/GPU memory
       (uncapped DPR on retina = 4-9× the pixels to composite).
   ========================================================================== */

import { countMatches } from '../lib/doc.mjs';

const LAYOUT_PROPS = ['top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding'];

export function analyze(doc) {
  const findings = [];
  let score = 100;

  // ── 1. animating layout props on scroll hot paths ─────────────────────
  // (a) CSS: `transition: ... <prop> ...` or a @keyframes that moves a layout
  //     prop. We look for transition declarations naming a forbidden prop.
  const transLayout = new RegExp(
    `transition(-property)?\\s*:\\s*[^;{}]*?\\b(${LAYOUT_PROPS.join('|')})\\b`,
    'i',
  );
  const transLayoutCount = countMatches(doc.cssText, transLayout);
  if (transLayoutCount > 0) {
    score -= 12 + Math.min(10, (transLayoutCount - 1) * 3);
    findings.push({
      level: 'error',
      msg: `CSS transition animates layout prop(s) (${transLayoutCount}×) — use transform: translate()/scale() instead (budget §1, guardrails §1.6)`,
      line: doc.lineOf(transLayout, 'css'),
    });
  }

  // (b) JS scroll hot path: a forbidden prop assigned to .style inside a
  //     scroll/rAF/ScrollTrigger context.
  const jsLayoutWrite = new RegExp(
    `\\.style\\.(${LAYOUT_PROPS.join('|')})\\s*=`,
    'i',
  );
  const jsLayoutGsap = new RegExp(
    `(gsap|tl|timeline)\\.(to|from|fromTo|set)\\([^)]*\\b(${LAYOUT_PROPS.join('|')})\\s*:`,
    'i',
  );
  const scrollContext = /addEventListener\(\s*['"]scroll['"]|requestAnimationFrame|ScrollTrigger|onUpdate|onScroll|useScroll/i.test(doc.jsText);
  const jsLayoutCount = countMatches(doc.jsText, jsLayoutWrite) + countMatches(doc.jsText, jsLayoutGsap);
  if (jsLayoutCount > 0 && scrollContext) {
    score -= 14;
    findings.push({
      level: 'error',
      msg: `JS animates layout prop(s) (${jsLayoutCount}×) in a scroll/rAF context — drive transform/opacity only (budget §1, guardrails §1.6)`,
      line: doc.lineOf(jsLayoutWrite, 'js') ?? doc.lineOf(jsLayoutGsap, 'js'),
    });
  } else if (jsLayoutCount > 0) {
    score -= 5;
    findings.push({
      level: 'warn',
      msg: `JS writes layout prop(s) (${jsLayoutCount}×) — fine if one-shot/off scroll path, but verify it is never scrubbed`,
      line: doc.lineOf(jsLayoutWrite, 'js') ?? doc.lineOf(jsLayoutGsap, 'js'),
    });
  }

  // ── 2. > 7 depth/parallax layers in a chapter (§1.7) ──────────────────
  // Count parallax-layer markers per chapter/section grouping. We approximate
  // "a chapter" by the densest cluster: total parallax markers vs. section count.
  const layerMarkers =
    countMatches(doc.markup, /\b(data-(depth|parallax|layer|speed))\b/i) +
    countMatches(doc.cssJs, /\.(parallax|layer|depth)-?\w*\b/i) +
    countMatches(doc.cssJs, /data-(depth|parallax|speed)/i);
  const chapters = Math.max(
    1,
    countMatches(doc.markup, /<section\b/i) ||
      countMatches(doc.markup, /\bdata-chapter\b/i) ||
      1,
  );
  const perChapter = layerMarkers / chapters;
  if (perChapter > 7) {
    score -= 12;
    findings.push({
      level: 'error',
      msg: `~${perChapter.toFixed(1)} depth/parallax layers per chapter (>7 cap) — beyond 7 the GPU drops layers to CPU raster (§1.7)`,
      line: doc.lineOf(/data-(depth|parallax|speed)/i, 'markup'),
    });
  } else if (perChapter > 5) {
    findings.push({
      level: 'info',
      msg: `~${perChapter.toFixed(1)} depth layers per chapter — under the 7 cap; keep an eye on mobile layer budget (4)`,
    });
  }

  // ── 3. render-blocking scripts in <head> without defer/async/module ────
  const headMatch = doc.markup.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  let blockingHead = 0;
  if (headMatch) {
    const head = headMatch[1];
    const scriptTags = head.match(/<script\b[^>]*>/gi) || [];
    for (const tag of scriptTags) {
      const hasSrc = /\bsrc\s*=/.test(tag);
      const isDeferred = /\b(defer|async)\b/.test(tag) || /type\s*=\s*['"]module['"]/i.test(tag);
      if (hasSrc && !isDeferred) blockingHead++;
    }
  }
  if (blockingHead > 0) {
    score -= 10 + Math.min(8, (blockingHead - 1) * 4);
    findings.push({
      level: 'error',
      msg: `${blockingHead} render-blocking <script src> in <head> without defer/async/module — critical JS must be 0KB blocking (budget §5)`,
      line: doc.lineOf(/<head\b/i, 'markup'),
    });
  }

  // ── 4. WebGL present but no devicePixelRatio / pixelRatio cap ──────────
  const webgl = /\b(getContext\(\s*['"]webgl2?['"]|WebGLRenderer|THREE\.|three\.module|model-viewer|new\s+Renderer)\b/i;
  const hasWebGL = webgl.test(doc.cssJs) || /<model-viewer\b/i.test(doc.markup);
  if (hasWebGL) {
    const dprCap =
      /setPixelRatio\s*\(\s*Math\.min/i.test(doc.jsText) ||
      /Math\.min\([^)]*devicePixelRatio/i.test(doc.jsText) ||
      /devicePixelRatio[^;]*Math\.min/i.test(doc.jsText) ||
      /pixelRatio\s*[:=]\s*Math\.min/i.test(doc.jsText);
    if (!dprCap) {
      score -= 12;
      findings.push({
        level: 'error',
        msg: 'WebGL detected with no devicePixelRatio cap — use renderer.setPixelRatio(Math.min(devicePixelRatio, 2)) to avoid GPU-memory blowup on retina (budget §2)',
        line: doc.lineOf(webgl, 'js'),
      });
    } else {
      findings.push({ level: 'pass', msg: 'WebGL present with a capped devicePixelRatio' });
    }
  }

  // ── positive signals ──────────────────────────────────────────────────
  if (transLayoutCount === 0 && jsLayoutCount === 0) {
    findings.push({ level: 'pass', msg: 'no layout-property animation found (transform/opacity only)' });
  }
  if (blockingHead === 0) {
    findings.push({ level: 'pass', msg: 'no render-blocking scripts in <head>' });
  }

  return {
    category: 'performance',
    score: Math.max(0, Math.round(score)),
    findings,
  };
}
