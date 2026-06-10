/* ============================================================================
   checks/mobile.mjs — touch-safe, never-dead mobile.

   Grounded in references/mobile-motion.md + performance-budget §3 + guardrails
   §1.9 ("A flat, motionless mobile page is itself a failure mode").

   Requires / rewards:
     • viewport meta (hard requirement — without it nothing else matters);
     • NOT hover-only: a :hover interaction must have a touch/pointer fallback
       (pointer: coarse media query, touchstart/pointer events, or @media(hover));
     • a mobile / reduced-layer path — a (max-width) breakpoint, (hover:none) /
       (pointer:coarse) query, or isTouch branch that degrades layers/tilt.
   ========================================================================== */

import { countMatches } from '../lib/doc.mjs';

export function analyze(doc) {
  const findings = [];
  let score = 100;

  // ── 1. viewport meta (hard requirement) ───────────────────────────────
  const viewport = /<meta\b[^>]*name\s*=\s*['"]viewport['"][^>]*>/i;
  const hasViewport = viewport.test(doc.markup);
  if (!hasViewport) {
    score -= 40;
    findings.push({
      level: 'error',
      msg: 'no <meta name="viewport"> — page will render at desktop width on phones, breaking every layout',
    });
  } else {
    findings.push({
      level: 'pass',
      msg: 'viewport meta present',
      line: doc.lineOf(viewport, 'markup'),
    });
  }

  // ── 2. hover-only interactions without touch/pointer fallback ─────────
  // Cards/buttons that only react to :hover are dead on touch. We treat the
  // build as having a touch fallback if ANY of these exist.
  const hoverCount = countMatches(doc.cssText, /:hover\b/i);
  const hoverGuard = /@media\s*\([^)]*hover\s*:\s*(hover|none)\)/i.test(doc.cssText);
  const pointerCoarse = /@media\s*\([^)]*pointer\s*:\s*coarse\)/i.test(doc.cssText) ||
    /matchMedia\([^)]*pointer\s*:\s*coarse/i.test(doc.jsText);
  const touchEvents = /(touchstart|touchmove|touchend|pointerdown|pointermove|onTouchStart|onPointerDown)/i.test(doc.jsText);
  const hasTouchFallback = hoverGuard || pointerCoarse || touchEvents;

  if (hoverCount > 0 && !hasTouchFallback) {
    score -= 22;
    findings.push({
      level: 'error',
      msg: `${hoverCount} :hover interaction(s) with no touch/pointer fallback — wrap in @media(hover:hover) or add pointer/touch handlers (mobile-motion.md)`,
      line: doc.lineOf(/:hover\b/i, 'css'),
    });
  } else if (hoverCount > 0) {
    findings.push({
      level: 'pass',
      msg: `:hover used but a touch/pointer fallback exists (${[hoverGuard && '@media hover', pointerCoarse && 'pointer:coarse', touchEvents && 'touch events'].filter(Boolean).join(', ')})`,
    });
  } else {
    findings.push({ level: 'info', msg: 'no :hover-only interactions' });
  }

  // ── 3. mobile / reduced-layer path (rewarded) ─────────────────────────
  const breakpoint = /@media[^{]*\(\s*(max|min)-width/i.test(doc.cssText);
  const touchBranch =
    pointerCoarse ||
    /matchMedia\([^)]*hover\s*:\s*none/i.test(doc.jsText) ||
    /\bisTouch\b/i.test(doc.jsText) ||
    /matchMedia\.add\(|gsap\.matchMedia|mm\.add\(/i.test(doc.jsText);
  const degrades = /(reduce|fewer|disable|skip|drop)[^;\n]{0,40}(layer|parallax|tilt|pin)/i.test(doc.cssJs) ||
    touchBranch;

  if (!breakpoint && !touchBranch) {
    score -= 18;
    findings.push({
      level: 'error',
      msg: 'no responsive breakpoint or touch branch — provide a mobile layout that keeps motion touch-safe (no 3D tilt, fewer layers) instead of a dead page (guardrails §1.9)',
    });
  } else {
    const bits = [breakpoint && 'breakpoint(s)', touchBranch && 'touch branch', degrades && 'explicit degrade'].filter(Boolean);
    findings.push({
      level: 'pass',
      msg: `mobile path present: ${bits.join(', ')}`,
      line: doc.lineOf(/@media[^{]*\(\s*(max|min)-width/i, 'css'),
    });
  }

  return {
    category: 'mobile',
    score: Math.max(0, Math.round(score)),
    findings,
  };
}
