import { clamp, damp, proximityToRect, createQualityGovernor, QUALITY } from './core.mjs';

/**
 * One scoped clock for motion. Native scrolling is the default. Integrations can
 * use clock:'external' and call tick(ms) from their existing GSAP/R3F clock.
 * subscribe receives a mutable snapshot; copy fields when retaining history.
 */
export function createCinematicRuntime(root, options = {}) {
  if (!root?.ownerDocument && root?.nodeType !== 9) throw new TypeError('A Document or Element root is required');
  const doc = root.ownerDocument || root, win = doc.defaultView;
  const scrollRoot = options.scroller || win;
  const governor = createQualityGovernor({ initial: options.initialQuality || 'balanced' });
  const reducedQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = win.matchMedia('(hover: hover) and (pointer: fine)');
  const subscribers = new Set(), readers = new Set(), targets = new Map(), disposers = [], continuous = new Set();
  let frame = 0, disposed = false, dirty = true, lastTime = 0, lastY = 0, lastX = 0, lastPointerY = 0;
  let sampleSeconds = 0, sampleFrames = 0, rootVisible = true, maxScroll = 1, viewportWidth = 1, viewportHeight = 1;
  let pendingPointer = { x: 0, y: 0, active: false }, requestedQuality = options.quality || 'auto';
  const signals = {
    scroll: { y: 0, progress: 0, velocity: 0, direction: 0 },
    pointer: { x: 0, y: 0, normalizedX: 0, normalizedY: 0, velocityX: 0, velocityY: 0, active: false },
    visible: !doc.hidden, reducedMotion: reducedQuery.matches, coarsePointer: !pointerQuery.matches,
    quality: 'balanced', time: 0, delta: 0,
  };
  const readY = () => scrollRoot === win ? win.scrollY : scrollRoot.scrollTop;
  function on(target, name, fn, config) {
    target.addEventListener(name, fn, config);
    disposers.push(() => target.removeEventListener(name, fn, config));
  }
  function wake() {
    if (disposed || frame || !signals.visible) return;
    if (options.clock === 'external') { options.onWake?.(); return; }
    frame = win.requestAnimationFrame(tick);
  }
  function refresh() { dirty = true; wake(); }
  function measure() {
    viewportWidth = scrollRoot === win ? win.innerWidth : scrollRoot.clientWidth;
    viewportHeight = scrollRoot === win ? win.innerHeight : scrollRoot.clientHeight;
    maxScroll = Math.max(1, (scrollRoot === win ? doc.documentElement.scrollHeight : scrollRoot.scrollHeight) - viewportHeight);
    const y = readY();
    for (const entry of targets.values()) {
      const r = entry.element.getBoundingClientRect();
      entry.rect = { left: r.left, right: r.right, top: r.top + y, bottom: r.bottom + y, width: r.width, height: r.height };
    }
    dirty = false;
  }
  function quality() {
    if (signals.reducedMotion || requestedQuality === 'static') return 'static';
    const wanted = requestedQuality === 'auto' ? governor.tier : requestedQuality;
    if (win.navigator.connection?.saveData) return 'low';
    return signals.coarsePointer && wanted === 'high' ? 'balanced' : wanted;
  }
  function tick(now) {
    frame = 0;
    if (disposed || !signals.visible) { lastTime = 0; return false; }
    const elapsed = lastTime ? (now - lastTime) / 1000 : 0;
    const dt = clamp(elapsed, 0, 0.05);
    lastTime = now;
    // Batch geometry reads before any subscriber can write styles.
    if (dirty) measure();
    const y = readY(), dy = y - lastY;
    signals.time = now / 1000; signals.delta = dt;
    signals.scroll.y = y; signals.scroll.progress = clamp(y / maxScroll);
    signals.scroll.direction = Math.sign(dy);
    signals.scroll.velocity = signals.reducedMotion ? 0 : damp(signals.scroll.velocity, dt ? clamp(dy / dt, -6000, 6000) : 0, 14, dt);
    lastY = y;
    const p = signals.pointer;
    p.active = pendingPointer.active && !signals.coarsePointer && !signals.reducedMotion;
    p.x = pendingPointer.x; p.y = pendingPointer.y;
    p.normalizedX = p.x / viewportWidth * 2 - 1; p.normalizedY = p.y / viewportHeight * 2 - 1;
    p.velocityX = p.active && dt ? damp(p.velocityX, clamp((p.x - lastX) / dt, -4000, 4000), 16, dt) : 0;
    p.velocityY = p.active && dt ? damp(p.velocityY, clamp((p.y - lastPointerY) / dt, -4000, 4000), 16, dt) : 0;
    lastX = p.x; lastPointerY = p.y;
    signals.quality = quality();
    for (const entry of targets.values()) {
      const r = entry.rect;
      entry.value = proximityToRect(p.x, p.y, { ...r, top: r.top - y, bottom: r.bottom - y }, entry.radius);
      if (!p.active) entry.value.amount = 0;
    }
    for (const fn of readers) fn(signals);
    let settling = false;
    for (const fn of subscribers) {
      try { settling = fn(signals) === true || settling; }
      catch (error) { options.onError?.(error); if (!options.onError) win.console.error('Cinematic effect failed', error); }
    }
    const moving = Math.abs(signals.scroll.velocity) > 0.5 || Math.abs(p.velocityX) + Math.abs(p.velocityY) > 0.5;
    // Sample active interaction/animation frames, never idle or background gaps.
    if ((continuous.size || settling || moving) && elapsed > 0 && elapsed < 0.25 && !signals.reducedMotion && signals.quality !== 'static') {
      sampleSeconds += elapsed; sampleFrames++;
      if (sampleSeconds >= 1) { governor.sample(sampleFrames / sampleSeconds, sampleSeconds); sampleSeconds = sampleFrames = 0; }
    }
    const active = Boolean(settling || moving || (continuous.size && !signals.reducedMotion && signals.quality !== 'static'));
    if (active) wake();
    else lastTime = 0;
    return active;
  }
  function preferenceChanged() {
    signals.reducedMotion = reducedQuery.matches; signals.coarsePointer = !pointerQuery.matches;
    signals.quality = quality(); refresh();
  }
  function visibilityChanged() {
    signals.visible = !doc.hidden && rootVisible;
    if (!signals.visible) { win.cancelAnimationFrame(frame); frame = 0; lastTime = 0; sampleSeconds = sampleFrames = 0; }
    else refresh();
    for (const fn of subscribers) fn(signals);
  }
  on(scrollRoot, 'scroll', wake, { passive: true });
  on(win, 'resize', refresh, { passive: true });
  on(win.visualViewport || win, 'resize', refresh, { passive: true });
  on(doc, 'pointermove', e => { pendingPointer = { x: e.clientX, y: e.clientY, active: e.pointerType !== 'touch' }; wake(); }, { passive: true });
  on(doc, 'pointerleave', () => { pendingPointer.active = false; wake(); });
  on(win, 'blur', () => { pendingPointer.active = false; wake(); });
  on(doc, 'visibilitychange', visibilityChanged);
  on(reducedQuery, 'change', preferenceChanged); on(pointerQuery, 'change', preferenceChanged);
  const resize = new win.ResizeObserver(refresh);
  resize.observe(root.nodeType === 9 ? doc.documentElement : root);
  disposers.push(() => resize.disconnect());
  if (root.nodeType !== 9) {
    const observer = new win.IntersectionObserver(([entry]) => { rootVisible = entry.isIntersecting; visibilityChanged(); });
    observer.observe(root); disposers.push(() => observer.disconnect());
  }
  doc.fonts?.ready.then(() => { if (!disposed) refresh(); });
  lastY = readY(); signals.scroll.y = lastY; preferenceChanged();
  return {
    signals, tick, refresh, wake,
    subscribe(fn) { subscribers.add(fn); wake(); return () => subscribers.delete(fn); },
    read(fn) { readers.add(fn); wake(); return () => readers.delete(fn); },
    continuous(owner = Symbol('animation')) { continuous.add(owner); wake(); return () => continuous.delete(owner); },
    track(element, { radius = 120 } = {}) {
      const key = Symbol('target'), entry = { element, radius, rect: null, value: { amount: 0, x: 0, y: 0, distance: Infinity } };
      targets.set(key, entry); resize.observe(element); refresh();
      return { get current() { return entry.value; }, dispose() { targets.delete(key); resize.unobserve(element); } };
    },
    setQuality(value) {
      if (value !== 'auto' && !QUALITY[value]) throw new TypeError('Unknown quality tier: ' + value);
      requestedQuality = value; wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true; win.cancelAnimationFrame(frame); disposers.reverse().forEach(fn => fn());
      subscribers.clear(); readers.clear(); targets.clear(); continuous.clear();
    },
  };
}
