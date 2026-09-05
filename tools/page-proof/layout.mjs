// Self-contained: serialized into the browser by Playwright's page.evaluate.
export function inspectLayout({ checkHeadings = false } = {}) {
  const findings = [];
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 2) {
    findings.push('horizontal document overflow');
  }
  function visible(el) {
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  for (const el of document.querySelectorAll('[data-proof-essential]')) {
    if (!visible(el)) findings.push('essential content hidden: ' + (el.id || el.tagName));
  }
  if (checkHeadings) {
    const headings = [...document.querySelectorAll('h1')].filter(el => !el.closest('[hidden], [aria-hidden="true"]'));
    const readable = headings.some(heading => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() && visible(walker.currentNode.parentElement)) return true;
      }
      return false;
    });
    if (headings.length && !readable) findings.push('no readable primary heading in static/reduced-motion mode');
  }
  for (const img of document.images) {
    const rect = img.getBoundingClientRect();
    if (visible(img) && rect.bottom > 0 && rect.top < innerHeight && img.complete && !img.naturalWidth) {
      findings.push('broken visible image: ' + (img.getAttribute('src') || '(no src)'));
    }
  }
  return findings;
}
