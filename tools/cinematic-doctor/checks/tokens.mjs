/* ============================================================================
   checks/tokens.mjs — design-token conformance.

   Grounded in design.md / tokens/ : a cinematic build should resolve color and
   easing through the token contract, not improvise literals. Determinism and
   theme-swappability depend on it.

   Flags "token leaks": a literal hex color or a literal cubic-bezier() used in a
   DECLARATION VALUE (a property that is not itself a custom-property definition).
     ✓ allowed:  --bg: #F7F5F1;            (a token DEFINITION)
     ✓ allowed:  color: var(--fg);          (a token REFERENCE)
     ✓ allowed:  color: var(--fg, #000);    (hex only as a var() fallback)
     ✗ leak:     color: #161310;            (literal — should be var(--fg))
     ✗ leak:     transition: opacity .5s cubic-bezier(.16,1,.3,1);  (→ var(--ease-reveal))

   N/A when the document has no CSS. Lenient by design (one category among six):
   it nudges toward tokens without failing a page that merely defines its own.
   ========================================================================== */

import { countMatches } from '../lib/doc.mjs';

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const BEZIER = /cubic-bezier\s*\(/i;

export function analyze(doc) {
  const css = doc.cssText || '';
  if (!css.trim()) return { category: 'tokens', score: null, na: true };

  const findings = [];
  let score = 100;

  // Scan declarations: `prop: value` pairs. Skip custom-property definitions
  // (prop starts with --) and strip var(...) so hex/bezier used only as a
  // var() fallback is not counted as a leak.
  const declRe = /(^|[;{]\s*)(-{0,2}[A-Za-z][\w-]*)\s*:\s*([^;{}]+)/g;
  const FUNC = /\b(rgba?|hsla?|hwb|lab|lch|oklch|oklab|color)\(/i;
  const NAMED = /\b(red|blue|green|white|black|gray|grey|yellow|orange|purple|pink|cyan|magenta|navy|teal|gold|silver|maroon|olive|lime|aqua|fuchsia|crimson|coral|salmon|khaki|indigo|violet|tan|beige|ivory)\b/i;
  const COLOR_PROP = /\b(color|background|border(-[a-z]+)?|fill|stroke|box-shadow|outline|text-shadow|caret-color|accent-color)\b/i;
  let colorLeaks = 0, bezierLeaks = 0, refs = 0, colorDecls = 0;
  let m;
  while ((m = declRe.exec(css)) !== null) {
    const prop = m[2];
    const rawVal = m[3];
    if (prop.startsWith('--')) continue;                 // a token definition, not a leak
    const val = rawVal.replace(/var\([^)]*\)/g, '');     // excuse var() (and its fallback)
    if (/var\(/.test(rawVal)) refs++;
    const isColorProp = COLOR_PROP.test(prop);
    if (isColorProp) colorDecls++;
    // count EVERY literal color, not just one per declaration (a single var() can't launder a hardcoded page)
    colorLeaks += (val.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
    if (FUNC.test(val)) colorLeaks += (val.match(new RegExp(FUNC.source, 'gi')) || []).length;
    if (isColorProp && NAMED.test(val)) colorLeaks += 1;
    if (BEZIER.test(val)) bezierLeaks++;
  }
  const hexLeaks = colorLeaks; // retained name for the presence check below

  if (colorLeaks > 0) {
    score -= Math.min(colorLeaks * 6, 42);
    findings.push({
      level: 'error',
      msg: `${colorLeaks} literal color(s) in declarations (hex / rgb()/hsl()/oklch() / named) — reference a role token (var(--fg|bg|accent|…)) so a theme swap works; see design.md §2`,
      line: doc.lineOf(HEX, 'css'),
    });
  }
  if (bezierLeaks > 0) {
    score -= Math.min(bezierLeaks * 8, 24);
    findings.push({
      level: 'error',
      msg: `${bezierLeaks} literal cubic-bezier() in declarations — use var(--ease-reveal|exit|playful|cut); see tokens/motion.tokens.json`,
      line: doc.lineOf(BEZIER, 'css'),
    });
  }
  if (refs === 0 && colorDecls > 0) {
    score -= 18;
    findings.push({
      level: 'error',
      msg: 'no var(--token) references found — this page is not on the token contract (design.md). Inline tokens/build/variables.css and use role vars',
    });
  } else if (refs > 0 && hexLeaks === 0 && bezierLeaks === 0) {
    findings.push({ level: 'pass', msg: `on the token contract: ${refs} var(--…) reference(s), no color/easing leaks` });
  }

  return { category: 'tokens', score: Math.max(0, score), findings };
}
