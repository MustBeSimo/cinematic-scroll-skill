/* ============================================================================
   lib/doc.mjs — the shared document model every check consumes.

   No parser dependency by design (HARD RULE). Instead we hand-roll a few
   forgiving, regex/string-level extractors that are *good enough* to ground the
   taste / performance / a11y / mobile / 3D checks in the real source text:

     • split the raw HTML into <style>…</style> (css) and <script>…</script> (js)
       blobs, plus the markup with those blobs blanked out (so a tag scan never
       trips over CSS/JS braces);
     • keep the FULL raw text too — some checks (e.g. "is there a viewport meta")
       are simplest against the whole file;
     • provide a line-number lookup so findings can point at a source line;
     • a tiny "strip CSS comments / JS comments / HTML comments" pass so a banned
       pattern that only appears inside a comment never produces a false finding.

   A "doc" is a plain object — analyze(doc) in each check pulls fields off it.
   ========================================================================== */

/** Build the line-offset table once so byte index → 1-based line is O(log n). */
function buildLineIndex(text) {
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') offsets.push(i + 1);
  }
  return offsets;
}

function offsetToLine(offsets, index) {
  // binary search for the greatest offset <= index
  let lo = 0, hi = offsets.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= index) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans + 1; // 1-based
}

/** Remove HTML comments but preserve length (replace with spaces) so offsets
    stay aligned with the original for line lookups. */
function blankHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));
}

/** Replace the *contents* of matched tag blocks with spaces, returning both the
    blanked markup and the concatenated contents (with their absolute offsets so
    we can still map a finding back to a line). */
function extractBlocks(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let blanked = '';
  let cursor = 0;
  const blocks = []; // { content, start } start = absolute offset of content
  let m;
  while ((m = re.exec(html)) !== null) {
    const full = m[0];
    const content = m[1];
    const contentStart = m.index + full.indexOf(content);
    blocks.push({ content, start: contentStart });
    // keep everything up to content, blank the content, keep the closing tag
    blanked += html.slice(cursor, contentStart);
    blanked += ' '.repeat(content.length);
    cursor = contentStart + content.length;
  }
  blanked += html.slice(cursor);
  return { blanked, blocks };
}

/** Strip CSS/JS line + block comments from a blob, preserving length so the
    blob's offsets still line up with the original file. */
function blankCodeComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))   // block
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) =>                    // line (not :// in urls)
      p1 + ' '.repeat(m.length - p1.length));
}

/**
 * Build the shared document model.
 * @param {string} raw   full HTML source
 * @param {string} file  source path (for reporting)
 */
export function buildDoc(raw, file = '<input>') {
  const html = blankHtmlComments(raw);

  // pull <style> then <script> out of the comment-blanked html
  const styleX = extractBlocks(html, 'style');
  const scriptX = extractBlocks(styleX.blanked, 'script');

  // markup = html with style+script CONTENT blanked → safe for tag scans
  const markup = scriptX.blanked;

  // css / js, each with comments blanked, plus their absolute start offsets
  const css = styleX.blocks.map((b) => ({ text: blankCodeComments(b.content), start: b.start }));
  const js = scriptX.blocks.map((b) => ({ text: blankCodeComments(b.content), start: b.start }));

  const cssText = css.map((b) => b.text).join('\n');
  const jsText = js.map((b) => b.text).join('\n');

  const offsets = buildLineIndex(raw);

  return {
    file,
    raw,                       // untouched source
    html,                      // comments blanked
    markup,                    // comments + style/script content blanked
    css,                       // [{text,start}] comment-blanked
    js,                        // [{text,start}] comment-blanked
    cssText,                   // all css joined
    jsText,                    // all js joined
    cssJs: cssText + '\n' + jsText,
    /** absolute file offset → 1-based line number */
    lineAt(index) { return offsetToLine(offsets, index); },
    /**
     * Find the line of the first match of `re` inside one of the blob arrays
     * ('css' | 'js' | 'markup' | 'raw'). Returns undefined if no match.
     */
    lineOf(re, where = 'raw') {
      const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
      const rx = new RegExp(re.source, flags);
      if (where === 'markup' || where === 'raw' || where === 'html') {
        const hay = where === 'raw' ? raw : (where === 'html' ? html : markup);
        const m = rx.exec(hay);
        return m ? this.lineAt(m.index) : undefined;
      }
      const blobs = where === 'css' ? css : js;
      for (const b of blobs) {
        rx.lastIndex = 0;
        const m = rx.exec(b.text);
        if (m) return this.lineAt(b.start + m.index);
      }
      return undefined;
    },
  };
}

/** Count non-overlapping matches of a global-able regex in a string. */
export function countMatches(text, re) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const rx = new RegExp(re.source, flags);
  let n = 0;
  while (rx.exec(text) !== null) n++;
  return n;
}
