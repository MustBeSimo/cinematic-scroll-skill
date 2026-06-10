/* ============================================================================
   checks/a11y.mjs — accessibility floor.

   Requires:
     • a prefers-reduced-motion block — performance-budget §3 Tier 4 + guardrails
       §1.9 / §5.5: "Include a reduced-motion fallback for every scroll-driven
       effect." This is the single most load-bearing a11y rule for this skill;
     • alt attributes on every <img>;
     • a :focus-visible or :focus style (keyboard users must see where they are);
     • at least one semantic landmark (main / nav / header / footer).
   ========================================================================== */

import { countMatches } from '../lib/doc.mjs';

export function analyze(doc) {
  const findings = [];
  let score = 100;

  // ── 1. prefers-reduced-motion block (heaviest weight) ─────────────────
  const prmCss = /@media[^{]*prefers-reduced-motion\s*:\s*reduce/i;
  const prmJs = /matchMedia\(\s*['"`]\(prefers-reduced-motion\s*:\s*reduce\)/i;
  const hasPrmCss = prmCss.test(doc.cssText);
  const hasPrmJs = prmJs.test(doc.jsText);
  if (!hasPrmCss && !hasPrmJs) {
    score -= 35;
    findings.push({
      level: 'error',
      msg: 'no prefers-reduced-motion handling — every scroll effect needs a reduced-motion fallback (budget §3 Tier 4, guardrails §1.9/§5)',
    });
  } else {
    findings.push({
      level: 'pass',
      msg: `prefers-reduced-motion handled (${hasPrmCss ? 'CSS' : ''}${hasPrmCss && hasPrmJs ? ' + ' : ''}${hasPrmJs ? 'JS' : ''})`,
      line: doc.lineOf(prmCss, 'css') ?? doc.lineOf(prmJs, 'js'),
    });
    if (hasPrmCss && !hasPrmJs) {
      findings.push({
        level: 'info',
        msg: 'reduced-motion handled in CSS only — budget §3 also wants JS detection to disable ScrollTrigger pinning/parallax',
      });
    }
  }

  // ── 2. <img> alt attributes ───────────────────────────────────────────
  const imgTags = doc.markup.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = imgTags.filter((t) => !/\balt\s*=/.test(t));
  if (imgTags.length === 0) {
    findings.push({ level: 'info', msg: 'no <img> elements (procedural/SVG imagery) — alt check N/A' });
  } else if (missingAlt.length > 0) {
    score -= Math.min(25, 8 + missingAlt.length * 6);
    findings.push({
      level: 'error',
      msg: `${missingAlt.length}/${imgTags.length} <img> missing alt — decorative images need alt="" too`,
      line: doc.lineOf(/<img\b(?![^>]*\balt\s*=)[^>]*>/i, 'markup'),
    });
  } else {
    findings.push({ level: 'pass', msg: `all ${imgTags.length} <img> have alt attributes` });
  }

  // ── 3. :focus-visible or :focus style ─────────────────────────────────
  const focusStyle = /:focus(-visible|-within)?\b/;
  if (!focusStyle.test(doc.cssText)) {
    score -= 18;
    findings.push({
      level: 'error',
      msg: 'no :focus / :focus-visible style — keyboard users need a visible focus indicator',
    });
  } else {
    const fv = /:focus-visible/.test(doc.cssText);
    findings.push({
      level: fv ? 'pass' : 'warn',
      msg: fv ? ':focus-visible style present' : ':focus style present (prefer :focus-visible to avoid rings on mouse click)',
      line: doc.lineOf(focusStyle, 'css'),
    });
    if (!fv) score -= 3;
  }

  // ── 4. semantic landmarks ─────────────────────────────────────────────
  const landmarks = ['main', 'nav', 'header', 'footer'].filter((tag) =>
    new RegExp(`<${tag}\\b`, 'i').test(doc.markup),
  );
  const roleLandmarks = countMatches(doc.markup, /role\s*=\s*['"](main|navigation|banner|contentinfo)['"]/i);
  if (landmarks.length === 0 && roleLandmarks === 0) {
    score -= 16;
    findings.push({
      level: 'error',
      msg: 'no semantic landmark (main/nav/header/footer) — screen-reader users navigate by landmark',
    });
  } else {
    findings.push({
      level: landmarks.includes('main') ? 'pass' : 'warn',
      msg: landmarks.includes('main')
        ? `landmarks present: ${landmarks.join(', ')}`
        : `landmarks present (${landmarks.join(', ') || 'role-based'}) but no <main> — add one to mark primary content`,
      line: doc.lineOf(/<(main|nav|header|footer)\b/i, 'markup'),
    });
    if (!landmarks.includes('main')) score -= 5;
  }

  return {
    category: 'a11y',
    score: Math.max(0, Math.round(score)),
    findings,
  };
}
