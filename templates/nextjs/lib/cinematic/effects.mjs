import { clamp, damp, seededRandom } from './core.mjs';

export const TEXT_VARIANTS = ['line-mask', 'word-cascade', 'character-wave', 'velocity-skew', 'scramble', 'variable-axis'];

/** Magnetic movement belongs on a visual child; the link/button hit area stays put. */
export function mountProximity(element, runtime, options = {}) {
  const variant = options.variant || element.dataset.cinematicProximity || 'magnetic';
  const visual = element.querySelector('[data-proximity-visual]') || element;
  const target = runtime.track(element, { radius: options.radius ?? 120 });
  const original = visual.getAttribute('style');
  let x = 0, y = 0, amount = 0;
  const unsubscribe = runtime.subscribe(s => {
    const p = target.current, enabled = s.pointer.active && !s.reducedMotion && s.quality !== 'static';
    const strength = options.strength ?? 12;
    const tx = enabled ? p.x * p.amount * strength : 0, ty = enabled ? p.y * p.amount * strength : 0;
    const rate = s.reducedMotion || s.quality === 'static' ? 100000 : 15;
    x = damp(x, tx, rate, s.delta || 1 / 60); y = damp(y, ty, rate, s.delta || 1 / 60);
    amount = damp(amount, enabled ? p.amount : 0, rate, s.delta || 1 / 60);
    if (variant === 'depth') visual.style.transform = `perspective(900px) rotateX(${-y * 0.35}deg) rotateY(${x * 0.35}deg) translateZ(${amount * 8}px)`;
    else visual.style.transform = `translate3d(${x}px,${y}px,0)`;
    visual.style.setProperty('--cinematic-proximity', String(amount));
    return Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(amount - (enabled ? p.amount : 0)) > 0.01;
  });
  return () => { unsubscribe(); target.dispose(); if (original === null) visual.removeAttribute('style'); else visual.setAttribute('style', original); };
}

/**
 * Text stays semantic and selectable. Never split controls or hide nested links.
 * Bounded reveals rebuild on font/width changes and restore exact original nodes.
 */
export function mountText(element, runtime, options = {}) {
  const variant = options.variant || element.dataset.cinematicText || 'word-cascade';
  if (!TEXT_VARIANTS.includes(variant)) throw new TypeError('Unknown text variant: ' + variant);
  if (element.querySelector('a,button,input,select,textarea,[contenteditable]')) return () => {};
  const doc = element.ownerDocument, win = doc.defaultView;
  const original = [...element.childNodes], savedStyle = element.getAttribute('style');
  const label = element.getAttribute('aria-label'), text = element.innerText || element.textContent;
  const originalHidden = element.getAttribute('aria-hidden');
  let pieces = [], wrappers = [], lineIndices = [], lineCount = 0, started = false, startTime = null, done = false, disposed = false, timer = 0, lastWidth = 0;
  const duration = Math.max(0.1, options.duration ?? 0.85), spread = options.stagger ?? 0.3;
  const random = seededRandom(42), charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let lastScramble = -1;
  function restoreNodes() { element.replaceChildren(...original); }
  function build() {
    if (disposed) return;
    restoreNodes(); pieces = []; wrappers = [];
    if (runtime.signals.reducedMotion || runtime.signals.quality === 'static') return;
    // Accessible name is stable; the decorative splitting is never announced.
    element.setAttribute('aria-label', label ?? text);
    if (variant === 'variable-axis') return;
    if (variant === 'scramble') {
      const span = doc.createElement('span'); span.setAttribute('aria-hidden', 'true'); span.style.whiteSpace = 'pre-line'; span.textContent = text;
      element.replaceChildren(span); pieces = [span]; return;
    }
    const fragment = doc.createDocumentFragment();
    function splitNode(node, parent) {
      if (node.nodeType !== 3) {
        const clone = node.cloneNode(false);
        for (const child of node.childNodes) splitNode(child, clone);
        parent.append(clone); return;
      }
      const words = node.textContent.split(/(\s+)/u);
      for (const word of words) {
      if (/^\s*$/u.test(word)) { parent.append(doc.createTextNode(word)); continue; }
      const wrapper = doc.createElement('span'); wrapper.setAttribute('aria-hidden', 'true');
      wrapper.style.cssText = 'display:inline-block;white-space:nowrap;vertical-align:baseline';
      if (variant === 'character-wave' || variant === 'velocity-skew') {
        const segments = typeof Intl.Segmenter === 'function'
          ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)].map(s => s.segment)
          : Array.from(word);
        for (const char of segments) {
          const span = doc.createElement('span'); span.textContent = char; span.style.display = 'inline-block';
          wrapper.append(span); pieces.push(span);
        }
      } else {
        const span = doc.createElement('span'); span.textContent = word; span.style.display = 'inline-block';
        wrapper.append(span); pieces.push(span);
      }
      wrappers.push(wrapper); parent.append(wrapper);
      }
    }
    for (const node of original) splitNode(node, fragment);
    element.replaceChildren(fragment);
    if (variant === 'line-mask') {
      // Clip each word on its actual line without destroying authored breaks or emphasis.
      for (const wrapper of wrappers) {
        wrapper.style.overflow = 'clip';
        wrapper.style.paddingBlock = '.08em'; wrapper.style.marginBlock = '-.08em';
      }
      // Measure once after splitting; all words sharing a baseline reveal together.
      const tops = wrappers.map(wrapper => Math.round(wrapper.getBoundingClientRect().top));
      const lines = [...new Set(tops)]; lineCount = lines.length;
      lineIndices = tops.map(top => lines.indexOf(top));
    }
    if (!done) for (const piece of pieces) { piece.style.opacity = '0'; piece.style.transform = 'translateY(.8em)'; }
    runtime.refresh();
  }
  const observer = new win.IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { started = true; runtime.wake(); }
  }, { threshold: 0.1 });
  observer.observe(element);
  const resize = new win.ResizeObserver(([entry]) => {
    if (Math.abs(entry.contentRect.width - lastWidth) < 1) return;
    lastWidth = entry.contentRect.width;
    win.clearTimeout(timer); timer = win.setTimeout(build, 100);
  });
  resize.observe(element);
  let lastReduced = runtime.signals.reducedMotion || runtime.signals.quality === 'static';
  const unsubscribe = runtime.subscribe(s => {
    const staticMode = s.reducedMotion || s.quality === 'static';
    if (lastReduced !== staticMode) { lastReduced = staticMode; build(); }
    if (staticMode) {
      restoreNodes();
      if (savedStyle === null) element.removeAttribute('style'); else element.setAttribute('style', savedStyle);
      return false;
    }
    if (!started) return false;
    if (startTime === null) startTime = s.time;
    const elapsed = s.time - startTime, progress = clamp(elapsed / duration);
    if (variant === 'variable-axis') {
      element.style.fontVariationSettings = `'wght' ${Math.round((options.weightFrom ?? 300) + ((options.weightTo ?? 600) - (options.weightFrom ?? 300)) * progress)}`;
    } else if (variant === 'scramble') {
      const bucket = Math.floor(elapsed * 20);
      if (!done && bucket !== lastScramble) {
        lastScramble = bucket;
        pieces[0].textContent = Array.from(text).map((char, i, all) => /\s/u.test(char) || i / all.length <= progress ? char : charset[Math.floor(random() * charset.length)]).join('');
      }
    } else {
      pieces.forEach((piece, index) => {
        const count = variant === 'line-mask' ? lineCount : pieces.length;
        const order = variant === 'line-mask' ? lineIndices[index] : index;
        const delay = count > 1 ? order / (count - 1) * spread : 0;
        const p = clamp((elapsed - delay) / duration), ease = 1 - (1 - p) ** 3;
        const velocity = variant === 'velocity-skew' ? clamp(s.scroll.velocity / 1000, -1, 1) : 0;
        const wave = variant === 'character-wave' ? Math.sin(index * 0.45 + p * Math.PI) * (1 - p) * 12 : 0;
        piece.style.transform = `translate3d(0,${(1 - ease) * 100}%,0) rotate(${wave}deg) skewY(${velocity * 5}deg)`;
        piece.style.opacity = String(ease);
      });
    }
    done = elapsed >= duration + spread;
    if (done && variant === 'scramble') pieces[0].textContent = text;
    return !done;
  });
  build();
  doc.fonts?.ready.then(() => { if (!disposed) build(); });
  return () => {
    disposed = true; win.clearTimeout(timer); unsubscribe(); observer.disconnect(); resize.disconnect(); restoreNodes();
    for (const [name, value] of [['style', savedStyle], ['aria-label', label], ['aria-hidden', originalHidden]]) {
      if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
    }
  };
}

export function mountDeclarativeEffects(root, runtime) {
  const cleanups = [];
  for (const el of root.querySelectorAll('[data-cinematic-text]')) cleanups.push(mountText(el, runtime));
  for (const el of root.querySelectorAll('[data-cinematic-proximity]')) cleanups.push(mountProximity(el, runtime));
  return () => cleanups.reverse().forEach(dispose => dispose());
}
