import { createCinematicRuntime, mountDeclarativeEffects } from '../../runtime/index.mjs';
import { createShaderLayer } from '../../runtime/webgl.mjs';
const runtime = createCinematicRuntime(document);
const cleanEffects = mountDeclarativeEffects(document, runtime);
const layer = createShaderLayer(document, runtime, { onError: error => console.error(error) });
const surfaces = [...document.querySelectorAll('[data-cinematic-distort]')].map(el => layer.add(el));
const quality = document.querySelector('#quality'), pause = document.querySelector('#pause'), status = document.querySelector('#render-status');
let paused = false, lastStatus = '';
const unsubscribe = runtime.subscribe(s => {
  const next = s.reducedMotion || s.quality === 'static' ? 'Static composition' : layer.canvas ? `${s.quality} / responding to you` : 'Static composition / WebGL unavailable';
  if (next !== lastStatus) { status.textContent = next; lastStatus = next; }
});
quality.addEventListener('change', () => { if (!paused) runtime.setQuality(quality.value); });
pause.addEventListener('click', () => {
  paused = !paused; pause.setAttribute('aria-pressed', String(paused)); pause.textContent = paused ? 'Resume motion' : 'Pause motion';
  runtime.setQuality(paused ? 'static' : quality.value);
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  unsubscribe(); surfaces.forEach(dispose => dispose()); layer.dispose(); cleanEffects(); runtime.dispose();
}, { once: true });
