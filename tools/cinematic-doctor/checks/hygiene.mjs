/* ============================================================================
   checks/hygiene.mjs — ADVISORY craft-hygiene check (weight 0 → never affects
   the score, never fails a build). It surfaces, as info-level findings, the
   smells a full QA audit caught shipping in real builds:

     (1) dead CSS classes      — defined in <style> but never used in markup or JS
     (2) dead JS attr-branches — hasAttribute/getAttribute('data-x') where no
                                  element carries data-x (the branch never runs)
     (3) file:// hazard        — external local <script src> (CORS-blocked from
                                  file://), so a "single-file" build isn't
                                  actually openable from disk

   These are guidance, not a gate: the category carries no weight, so the total
   is unchanged. Heuristic + conservative (it under-reports rather than spam):
   a class referenced anywhere in JS is treated as used.
   ========================================================================== */

const CAP = 8;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function analyze(doc) {
  const findings = [];
  const js = doc.jsText;

  // (1) dead CSS classes ------------------------------------------------------
  const defined = new Set();
  for (const m of doc.cssText.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) defined.add(m[1]);
  const used = new Set();
  for (const m of doc.markup.matchAll(/class\s*=\s*["']([^"']*)["']/gi))
    for (const t of m[1].split(/\s+/)) if (t) used.add(t);
  const dead = [...defined].filter(
    (c) => c.length >= 2 && !used.has(c) && !new RegExp(`\\b${esc(c)}\\b`).test(js),
  );
  for (const c of dead.slice(0, CAP))
    findings.push({
      level: 'info',
      msg: `dead CSS class .${c} — defined in <style> but never used in markup or JS (remove it).`,
      line: doc.lineOf(new RegExp(`\\.${esc(c)}\\b`), 'css'),
    });
  if (dead.length > CAP)
    findings.push({ level: 'info', msg: `…and ${dead.length - CAP} more dead CSS class(es).` });

  // (2) dead JS attribute-branches -------------------------------------------
  const attrSeen = new Set();
  for (const m of doc.markup.matchAll(/\b(data-[\w-]+)\s*=/gi)) attrSeen.add(m[1].toLowerCase());
  const checked = new Set();
  for (const m of js.matchAll(/(?:has|get)Attribute\(\s*['"](data-[\w-]+)['"]\s*\)/gi))
    checked.add(m[1].toLowerCase());
  for (const a of checked) {
    const setInJs = new RegExp(`setAttribute\\(\\s*['"]${esc(a)}['"]`, 'i').test(js);
    const inMarkup = new RegExp(`\\b${esc(a)}\\s*=`, 'i').test(doc.markup);
    if (!attrSeen.has(a) && !setInJs && !inMarkup)
      findings.push({
        level: 'info',
        msg: `dead branch: JS reads [${a}] but no element carries it (never set in markup or via setAttribute) — the branch never runs.`,
        line: doc.lineOf(new RegExp(`Attribute\\(\\s*['"]${esc(a)}`), 'js'),
      });
  }

  // (3) file:// hazard: external local <script src> ---------------------------
  const ext = [];
  for (const m of doc.markup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const src = m[1];
    if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) continue; // CDN / absolute is fine
    if (/\.m?js(\?|#|$)/i.test(src)) ext.push(src);
  }
  for (const src of ext.slice(0, CAP))
    findings.push({
      level: 'info',
      msg: `external local script <script src="${src}"> is blocked by file:// CORS — inline it for a true single-file build, or document that this page must be served (e.g. \`python3 -m http.server\`).`,
      line: doc.lineOf(new RegExp(`src\\s*=\\s*["']${esc(src)}`), 'markup'),
    });

  // Weight-0 advisory: score is always 100; only the findings carry signal.
  return { category: 'hygiene', score: 100, findings };
}
