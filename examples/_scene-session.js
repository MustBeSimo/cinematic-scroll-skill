/** One demand-aware frame owner for the opt-in 3D studies. Aureus uses its own runtime. */
export function createSceneSession({canvas, frame, resize, restore, motionChange = () => {}}) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, last = 0, time = 0, paused = false, lost = false, visible = true, active = false, suspended = false;
  let frames = 0;
  const available = () => active && !lost && visible && !document.hidden && !suspended;
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function draw(now) {
    raf = 0;
    if (!available()) return;
    const reduced = motion.matches;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (!reduced && !paused) time += dt;
    frame({dt, time, reduced, paused});
    canvas.dataset.sceneFrames = String(++frames);
    canvas.dataset.sceneState = reduced ? 'reduced' : paused ? 'paused' : 'running';
    if (!reduced && !paused) raf = requestAnimationFrame(draw); else last = 0;
  }
  function invalidate() { if (available() && !raf) raf = requestAnimationFrame(draw); }
  function sync() { stop(); invalidate(); }
  function onMotion() { motionChange(motion.matches); sync(); }
  function onLost(e) { e.preventDefault(); lost = true; stop(); canvas.dataset.sceneState = 'lost'; document.body.classList.add('no-webgl'); }
  async function onRestored() { try { await restore?.(); lost = false; document.body.classList.remove('no-webgl'); resize?.(); sync(); } catch(e) { canvas.dataset.sceneState='unavailable'; console.warn('Scene recovery failed',e); } }
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  io.observe(canvas);
  const onResize = () => { resize?.(); invalidate(); };
  const onHide = () => { suspended = true; stop(); };
  const onShow = () => { suspended = false; sync(); };
  addEventListener('resize', onResize, {passive:true});
  addEventListener('pagehide', onHide); addEventListener('pageshow', onShow);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', onMotion);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return {
    start() { active = true; onMotion(); },
    invalidate,
    setPaused(value) { paused = value; sync(); },
    get reduced() { return motion.matches; },
    dispose() {
      active = false; stop(); io.disconnect();
      removeEventListener('resize', onResize); removeEventListener('pagehide', onHide); removeEventListener('pageshow', onShow);
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', onMotion);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
    }
  };
}
