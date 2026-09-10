import { QUALITY, clamp } from './core.mjs';
import { vertexShader, fragmentShader, SHADER_PRESETS } from './shaders.mjs';

/** One WebGL2 overlay serves multiple DOM media surfaces. The DOM is the fallback. */
export function createShaderLayer(root, runtime, options = {}) {
  const doc = root.ownerDocument || root, win = doc.defaultView;
  const canvas = doc.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); canvas.dataset.cinematicCanvas = 'webgl2';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return { canvas: null, add: () => () => {}, dispose() {}, info: { backend: 'static', draws: 0 } };
  (root.nodeType === 9 ? doc.body : root).append(canvas);
  const surfaces = new Set(), programs = new Map();
  let vao, buffer, lost = false, disposed = false, releaseContinuous = null, rects = [];
  const info = { backend: 'webgl2', draws: 0, surfaces: 0, dpr: 1, programs: 0, frames: 0 };
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(error);
    }
    return shader;
  }
  function program(preset) {
    if (programs.has(preset)) return programs.get(preset);
    const vs = compile(gl.VERTEX_SHADER, vertexShader), fs = compile(gl.FRAGMENT_SHADER, fragmentShader(preset));
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { const error = gl.getProgramInfoLog(p); gl.deleteProgram(p); throw new Error(error); }
    const uniforms = {};
    for (const name of ['uTime','uProgress','uVelocity','uProximity','uQuality','uReducedMotion','uHasTexture','uPointer','uResolution','uImageSize','uColorA','uColorB','uTexture','uRadiusX','uRadiusY']) uniforms[name] = gl.getUniformLocation(p, name);
    const entry = { p, uniforms, position: gl.getAttribLocation(p, 'position') };
    programs.set(preset, entry); info.programs = programs.size; return entry;
  }
  function init() {
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  }
  function upload(surface) {
    if (lost || disposed || !surfaces.has(surface)) return;
    if (surface.image && (!surface.image.complete || !surface.image.naturalWidth)) return;
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    try {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      if (surface.image?.complete && surface.image.naturalWidth) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, surface.image);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
      if (surface.texture) gl.deleteTexture(surface.texture);
      surface.texture = texture; runtime.wake();
    } catch (error) { gl.deleteTexture(texture); surface.failed = true; options.onError?.(error); }
  }
  init();
  function draw(s) {
    if (disposed || lost) return false;
    canvas.style.display = s.visible && !s.reducedMotion && s.quality !== 'static' ? 'block' : 'none';
    if (!s.visible || s.reducedMotion || s.quality === 'static') return false;
    const dpr = Math.min(win.devicePixelRatio || 1, QUALITY[s.quality].dpr), width = Math.round(win.innerWidth * dpr), height = Math.round(win.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    info.dpr = dpr; info.draws = 0;
    gl.disable(gl.SCISSOR_TEST); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST);
    for (const [surface, r, radii] of rects) {
      if (surface.failed || !surface.texture || r.bottom <= 0 || r.top >= win.innerHeight || r.right <= 0 || r.left >= win.innerWidth) continue;
      try {
        const { p, uniforms: u, position } = program(surface.preset);
        gl.useProgram(p); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        const x = Math.round(r.left * dpr), y = Math.round((win.innerHeight - r.bottom) * dpr), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        gl.viewport(x,y,w,h); gl.scissor(x,y,w,h);
        gl.uniform1f(u.uTime, s.time); gl.uniform1f(u.uProgress, surface.progress?.(s) ?? clamp((win.innerHeight - r.top) / (win.innerHeight + r.height)));
        gl.uniform1f(u.uVelocity, clamp(s.scroll.velocity / 2000, -1, 1));
        gl.uniform1f(u.uProximity, surface.target.current.amount);
        gl.uniform1f(u.uQuality, { high: 3, balanced: 2, low: 1 }[s.quality]); gl.uniform1f(u.uReducedMotion, 0);
        gl.uniform2f(u.uPointer, clamp((s.pointer.x-r.left)/Math.max(1,r.width)), 1-clamp((s.pointer.y-r.top)/Math.max(1,r.height)));
        gl.uniform2f(u.uResolution,r.width,r.height);
        gl.uniform4fv(u.uRadiusX,radii.x); gl.uniform4fv(u.uRadiusY,radii.y);
        gl.uniform2f(u.uImageSize,surface.image?.naturalWidth||1,surface.image?.naturalHeight||1);
        gl.uniform3fv(u.uColorA,surface.colorA); gl.uniform3fv(u.uColorB,surface.colorB);
        gl.uniform1f(u.uHasTexture, Number(!!surface.image?.naturalWidth));
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,surface.texture); gl.uniform1i(u.uTexture,0);
        gl.drawArrays(gl.TRIANGLES,0,6); info.draws++;
      } catch (error) { surface.failed = true; options.onError?.(error); }
    }
    info.frames++;
    return false;
  }
  const unread = runtime.read(() => {
    rects = [...surfaces].map(surface => {
      const r = surface.element.getBoundingClientRect(), css = win.getComputedStyle(surface.element);
      const values = [css.borderTopLeftRadius,css.borderTopRightRadius,css.borderBottomRightRadius,css.borderBottomLeftRadius];
      const radius = (value,size) => value.endsWith('%') ? parseFloat(value)*size/100 : parseFloat(value)||0;
      const radii = {x:[],y:[]};
      for (const value of values) {
        const [x,y=x] = value.split(' ');
        radii.x.push(Math.min(r.width/2,radius(x,r.width))); radii.y.push(Math.min(r.height/2,radius(y,r.height)));
      }
      return [surface,r,radii];
    });
    const animated = !lost && rects.some(([surface,r]) => surface.preset === 'atmosphere' && !surface.failed && r.bottom > 0 && r.top < win.innerHeight && r.right > 0 && r.left < win.innerWidth);
    if (animated && !releaseContinuous) releaseContinuous = runtime.continuous(canvas);
    if (!animated) { releaseContinuous?.(); releaseContinuous = null; }
  });
  const unsubscribe = runtime.subscribe(draw);
  function lostContext(event) {
    event.preventDefault(); lost = true; canvas.style.display = 'none'; programs.clear(); info.programs = 0;
    releaseContinuous?.(); releaseContinuous = null;
  }
  function restoredContext() {
    if (disposed) return;
    lost = false; init();
    for (const surface of surfaces) { surface.texture = null; surface.failed = false; upload(surface); }
    runtime.refresh();
  }
  canvas.addEventListener('webglcontextlost',lostContext); canvas.addEventListener('webglcontextrestored',restoredContext);
  return {
    canvas, info,
    add(element, config = {}) {
      const preset = config.preset || element.dataset.cinematicDistort || 'displacement';
      if (!SHADER_PRESETS.includes(preset)) throw new TypeError('Unknown shader preset: '+preset);
      const surface = { element, preset, image: config.image || element.querySelector('img'), colorA: config.colorA || [.025,.05,.15], colorB: config.colorB || [.15,.5,1], progress: config.progress, target: runtime.track(element), texture: null, failed: false };
      surfaces.add(surface); info.surfaces = surfaces.size; upload(surface);
      const load = () => upload(surface); surface.load = load; surface.image?.addEventListener('load',load);
      if (surface.image && !surface.image.complete) surface.image.decode?.().then(load).catch(() => {});
      runtime.refresh();
      return () => {
        surfaces.delete(surface); info.surfaces = surfaces.size; surface.target.dispose(); surface.image?.removeEventListener('load',load);
        if (!lost) gl.deleteTexture(surface.texture);
        if (![...surfaces].some(s => s.preset === 'atmosphere')) { releaseContinuous?.(); releaseContinuous = null; }
        runtime.wake();
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true; unsubscribe(); unread(); releaseContinuous?.();
      for (const surface of surfaces) { surface.target.dispose(); surface.image?.removeEventListener('load', surface.load); gl.deleteTexture(surface.texture); }
      surfaces.clear(); for (const {p} of programs.values()) gl.deleteProgram(p); programs.clear();
      gl.deleteBuffer(buffer); gl.deleteVertexArray(vao);
      canvas.removeEventListener('webglcontextlost',lostContext); canvas.removeEventListener('webglcontextrestored',restoredContext); canvas.remove();
    },
  };
}
