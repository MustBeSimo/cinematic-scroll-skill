/* ============================================================================
   checks/taste.mjs — anti-convergence + craft.

   Grounded in taste-guardrails.md §4 (Anti-Convergence) and §1.11:
     • "transition: all"            — lazy blanket transition (always a smell)
     • default / linear easings     — §4.1: ease / ease-in-out / linear are banned
     • convergent fade-ins          — §1.11 / §4.5: every section using the *same*
                                       entrance treatment reads as a template
     • no custom cubic-bezier       — §4.1: at least one intentional curve required

   "The difference between slop and craft is anti-convergence." This check is the
   heart of why the tool exists, so it carries the highest weight.
   ========================================================================== */

import { countMatches } from '../lib/doc.mjs';

export function analyze(doc) {
  const findings = [];
  let score = 100;
  const css = doc.cssText;
  const cssJs = doc.cssJs;

  // ── 1. transition: all ────────────────────────────────────────────────
  // `transition: all …` repaints/relayouts unpredictably and signals the
  // author didn't decide *what* transitions. Banned outright.
  const transAll = /transition(-property)?\s*:\s*all\b/i;
  const transAllCount = countMatches(css, transAll);
  if (transAllCount > 0) {
    score -= 22;
    findings.push({
      level: 'error',
      msg: `"transition: all" used ${transAllCount}× — name the properties you animate (transform/opacity)`,
      line: doc.lineOf(transAll, 'css'),
    });
  }

  // ── 2. custom cubic-bezier present at all? (§4.1) ──────────────────────
  const cubic = /cubic-bezier\s*\(/i;
  const cubicCount = countMatches(cssJs, cubic);
  // GSAP/Framer named eases with intentional character also count as "custom".
  const namedEase =
    /\b(power[1-4]|back|elastic|expo|circ|sine|steps|bounce|easeInOut|easeOut|easeIn)\b/;
  const hasNamedEase = namedEase.test(doc.jsText);
  if (cubicCount === 0 && !hasNamedEase) {
    score -= 25;
    findings.push({
      level: 'error',
      msg: 'no custom cubic-bezier (or named GSAP/Framer ease) anywhere — every motion must have an intentional curve (§4.1)',
    });
  }

  // ── 3. default / linear easings used pervasively (§4.1) ────────────────
  // Match easing *values* only — anchored to a transition/animation declaration
  // so we never trip on `linear-gradient(` or a custom-property *name* like
  // `--ease-in-out`. The negative lookahead drops `linear` immediately followed
  // by `-gradient`.
  const defaultEaseDecl =
    /(transition|animation)(-timing-function)?\s*:\s*[^;{}]*?\b(ease-in-out|ease-out|ease-in|ease|linear)\b(?!-?gradient)/i;
  const defaultEaseCount = countMatches(css, defaultEaseDecl);
  if (defaultEaseCount > 0) {
    const lineHint = doc.lineOf(/(transition|animation)[^;{}]*?\b(ease-in-out|ease-out|ease-in|ease|linear)\b/i, 'css');
    if (cubicCount === 0 && !hasNamedEase) {
      // already heavily penalized above; add a softer nudge
      score -= 6;
      findings.push({
        level: 'warn',
        msg: `${defaultEaseCount} default/linear easing value(s) and no custom curves — motion will feel mechanical`,
        line: lineHint,
      });
    } else if (defaultEaseCount >= 4) {
      score -= 12;
      findings.push({
        level: 'warn',
        msg: `default/linear easing used pervasively (${defaultEaseCount}×) despite custom curves existing — reserve ease/linear for non-cinematic UI only (§4.1)`,
        line: lineHint,
      });
    } else {
      score -= 4;
      findings.push({
        level: 'info',
        msg: `${defaultEaseCount} default/linear easing value(s) — acceptable for incidental UI, but cinematic motion needs custom curves (§4.1)`,
        line: lineHint,
      });
    }
  }

  // ── 4. convergence: every section the same fade-in (§4.5 / §1.11) ──────
  // Heuristic: count distinct entrance "treatments" referenced in the source
  // vs. how many sections/chapters exist. One treatment across many sections =
  // convergence.
  const sectionCount = countMatches(doc.markup, /<section\b/i) +
    countMatches(doc.markup, /\bdata-(chapter|scene|reveal)\b/i);

  // catalogue treatment vocabulary actually present (taste-guardrails §4.5)
  const treatmentSignals = {
    'fade': /(fade|opacity\s*:\s*0)/i,
    'mask/clip': /clip-path\s*:\s*inset|clip-path\s*:\s*polygon/i,
    'word/line stagger': /\bstagger\b|split(text|type)|\.word|\.line\b/i,
    'translate rise': /translateY\(|y\s*:\s*\d|\btranslate3d\(\s*0/i,
    'scale entrance': /scale\(\s*1\.[1-9]|scale\s*:\s*1\.[1-9]/i,
    'letter-spacing scrub': /letter-spacing/i,
    'blur crossfade': /crossfade|two\s+title|sharp.*blur/i,
  };
  const present = Object.entries(treatmentSignals)
    .filter(([, re]) => re.test(cssJs))
    .map(([name]) => name);

  const fadeOnly =
    present.length <= 1 &&
    /(fade|opacity\s*:\s*0|fade-in)/i.test(cssJs) &&
    sectionCount >= 3;

  if (fadeOnly) {
    score -= 18;
    findings.push({
      level: 'error',
      msg: `${sectionCount} sections appear to share a single fade-in entrance — vary title/entrance treatment per chapter (§4.5: mask, word-stagger, scale, letter-spacing scrub…)`,
      line: doc.lineOf(/<section\b/i, 'markup'),
    });
  } else if (sectionCount >= 4 && present.length < 2) {
    score -= 8;
    findings.push({
      level: 'warn',
      msg: `${sectionCount} sections but only ${present.length || 0} distinct entrance treatment(s) detected — risk of convergence (§4.5)`,
    });
  } else if (present.length >= 3) {
    findings.push({
      level: 'pass',
      msg: `varied entrance vocabulary detected: ${present.join(', ')}`,
    });
  }

  if (transAllCount === 0 && cubicCount > 0) {
    findings.push({
      level: 'pass',
      msg: `${cubicCount} custom cubic-bezier curve(s); no "transition: all"`,
    });
  }

  return {
    category: 'taste',
    score: Math.max(0, Math.round(score)),
    findings,
  };
}
