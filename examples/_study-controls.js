/** Native, scene-owned controls. Mount only after the renderer is usable. */
export function mountSceneControls({ title, label, min, max, step, value, format = String, update, pause }) {
  const panel = document.createElement('details');
  panel.className = 'cs-scene-controls';
  const summary = document.createElement('summary');
  summary.textContent = title;
  const body = document.createElement('div');
  const caption = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = label;
  const output = document.createElement('output');
  const range = document.createElement('input');
  range.type = 'range';
  Object.assign(range, { min, max, step, value });
  range.setAttribute('aria-label', label);
  caption.append(text, output, range);
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Reset study';
  const apply = () => {
    const next = Number(range.value);
    output.value = format(next);
    range.setAttribute('aria-valuetext', format(next));
    update(next);
  };
  range.addEventListener('input', apply);
  reset.addEventListener('click', () => { range.value = value; apply(); });
  body.append(caption, reset);
  if (pause) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Pause drift';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Resume drift' : 'Pause drift';
      pause(paused);
    });
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const reflectMotion = () => {
      toggle.disabled = motion.matches;
      toggle.textContent = motion.matches ? 'Motion reduced' : toggle.getAttribute('aria-pressed') === 'true' ? 'Resume drift' : 'Pause drift';
    };
    motion.addEventListener('change', reflectMotion);
    reflectMotion();
    panel._disposeMotion = () => motion.removeEventListener('change', reflectMotion);
    body.append(toggle);
  }
  panel.append(summary, body);
  document.body.append(panel);
  apply();
  return () => { panel._disposeMotion?.(); panel.remove(); };
}
