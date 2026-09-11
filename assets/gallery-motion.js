(() => {
  // runtime/core.mjs
  var clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  var damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));
  function proximityToRect(x, y, rect, radius = 120) {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    const distance = Math.hypot(dx, dy);
    const amount = radius > 0 ? clamp(1 - distance / radius) : Number(distance === 0);
    return {
      distance,
      amount: amount * amount * (3 - 2 * amount),
      x: clamp((x - rect.left) / Math.max(1, rect.width), 0, 1) * 2 - 1,
      y: clamp((y - rect.top) / Math.max(1, rect.height), 0, 1) * 2 - 1
    };
  }
  var QUALITY = Object.freeze({
    high: Object.freeze({ dpr: 1.5, particles: 1, shadowSize: 1024, post: "full", marchSteps: 64 }),
    balanced: Object.freeze({ dpr: 1.25, particles: 0.5, shadowSize: 512, post: "bloom", marchSteps: 48 }),
    low: Object.freeze({ dpr: 1, particles: 0.25, shadowSize: 0, post: "none", marchSteps: 32 }),
    static: Object.freeze({ dpr: 1, particles: 0, shadowSize: 0, post: "none", marchSteps: 0 })
  });
  function createQualityGovernor({ initial = "balanced", lowFps = 45, highFps = 58 } = {}) {
    const tiers = ["low", "balanced", "high"];
    if (!tiers.includes(initial)) throw new TypeError("Initial quality must be low, balanced, or high");
    let index = tiers.indexOf(initial), bad = 0, stable = 0, reversals = 0, direction = 0, locked = false;
    return {
      get tier() {
        return tiers[index];
      },
      get locked() {
        return locked;
      },
      sample(fps, seconds = 1) {
        if (locked || !Number.isFinite(fps) || fps <= 0 || seconds <= 0) return tiers[index];
        bad = fps < lowFps ? bad + 1 : 0;
        stable = fps >= highFps ? stable + seconds : 0;
        const next = bad >= 2 ? Math.max(0, index - 1) : stable >= 5 ? Math.min(2, index + 1) : index;
        if (next !== index) {
          const move = Math.sign(next - index);
          if (direction && move !== direction) reversals++;
          direction = move;
          index = next;
          bad = stable = 0;
          if (reversals >= 3) {
            locked = true;
            index = 0;
          }
        }
        return tiers[index];
      }
    };
  }
  function seededRandom(seed = 1) {
    let state = seed >>> 0;
    return () => {
      state += 1831565813;
      let x = state;
      x = Math.imul(x ^ x >>> 15, x | 1);
      x ^= x + Math.imul(x ^ x >>> 7, x | 61);
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
  }

  // runtime/cinematic.mjs
  function createCinematicRuntime(root, options = {}) {
    if (!root?.ownerDocument && root?.nodeType !== 9) throw new TypeError("A Document or Element root is required");
    const doc = root.ownerDocument || root, win = doc.defaultView;
    const scrollRoot = options.scroller || win;
    const governor = createQualityGovernor({ initial: options.initialQuality || "balanced" });
    const reducedQuery = win.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = win.matchMedia("(hover: hover) and (pointer: fine)");
    const subscribers = /* @__PURE__ */ new Set(), readers = /* @__PURE__ */ new Set(), targets = /* @__PURE__ */ new Map(), disposers = [], continuous = /* @__PURE__ */ new Set();
    let frame = 0, disposed = false, dirty = true, lastTime = 0, lastY = 0, lastX = 0, lastPointerY = 0;
    let sampleSeconds = 0, sampleFrames = 0, rootVisible = true, maxScroll = 1, viewportWidth = 1, viewportHeight = 1;
    let pendingPointer = { x: 0, y: 0, active: false }, requestedQuality = options.quality || "auto";
    const signals = {
      scroll: { y: 0, progress: 0, velocity: 0, direction: 0 },
      pointer: { x: 0, y: 0, normalizedX: 0, normalizedY: 0, velocityX: 0, velocityY: 0, active: false },
      visible: !doc.hidden,
      reducedMotion: reducedQuery.matches,
      coarsePointer: !pointerQuery.matches,
      quality: "balanced",
      time: 0,
      delta: 0
    };
    const readY = () => scrollRoot === win ? win.scrollY : scrollRoot.scrollTop;
    function on(target, name, fn, config) {
      target.addEventListener(name, fn, config);
      disposers.push(() => target.removeEventListener(name, fn, config));
    }
    function wake() {
      if (disposed || frame || !signals.visible) return;
      if (options.clock === "external") {
        options.onWake?.();
        return;
      }
      frame = win.requestAnimationFrame(tick);
    }
    function refresh() {
      dirty = true;
      wake();
    }
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
      if (signals.reducedMotion || requestedQuality === "static") return "static";
      const wanted = requestedQuality === "auto" ? governor.tier : requestedQuality;
      if (win.navigator.connection?.saveData) return "low";
      return signals.coarsePointer && wanted === "high" ? "balanced" : wanted;
    }
    function tick(now) {
      frame = 0;
      if (disposed || !signals.visible) {
        lastTime = 0;
        return false;
      }
      const elapsed = lastTime ? (now - lastTime) / 1e3 : 0;
      const dt = clamp(elapsed, 0, 0.05);
      lastTime = now;
      if (dirty) measure();
      const y = readY(), dy = y - lastY;
      signals.time = now / 1e3;
      signals.delta = dt;
      signals.scroll.y = y;
      signals.scroll.progress = clamp(y / maxScroll);
      signals.scroll.direction = Math.sign(dy);
      signals.scroll.velocity = signals.reducedMotion ? 0 : damp(signals.scroll.velocity, dt ? clamp(dy / dt, -6e3, 6e3) : 0, 14, dt);
      lastY = y;
      const p = signals.pointer;
      p.active = pendingPointer.active && !signals.coarsePointer && !signals.reducedMotion;
      p.x = pendingPointer.x;
      p.y = pendingPointer.y;
      p.normalizedX = p.x / viewportWidth * 2 - 1;
      p.normalizedY = p.y / viewportHeight * 2 - 1;
      p.velocityX = p.active && dt ? damp(p.velocityX, clamp((p.x - lastX) / dt, -4e3, 4e3), 16, dt) : 0;
      p.velocityY = p.active && dt ? damp(p.velocityY, clamp((p.y - lastPointerY) / dt, -4e3, 4e3), 16, dt) : 0;
      lastX = p.x;
      lastPointerY = p.y;
      signals.quality = quality();
      for (const entry of targets.values()) {
        const r = entry.rect;
        entry.value = proximityToRect(p.x, p.y, { ...r, top: r.top - y, bottom: r.bottom - y }, entry.radius);
        if (!p.active) entry.value.amount = 0;
      }
      for (const fn of readers) fn(signals);
      let settling = false;
      for (const fn of subscribers) {
        try {
          settling = fn(signals) === true || settling;
        } catch (error) {
          options.onError?.(error);
          if (!options.onError) win.console.error("Cinematic effect failed", error);
        }
      }
      const moving = Math.abs(signals.scroll.velocity) > 0.5 || Math.abs(p.velocityX) + Math.abs(p.velocityY) > 0.5;
      if ((continuous.size || settling || moving) && elapsed > 0 && elapsed < 0.25 && !signals.reducedMotion && signals.quality !== "static") {
        sampleSeconds += elapsed;
        sampleFrames++;
        if (sampleSeconds >= 1) {
          governor.sample(sampleFrames / sampleSeconds, sampleSeconds);
          sampleSeconds = sampleFrames = 0;
        }
      }
      const active = Boolean(settling || moving || continuous.size && !signals.reducedMotion && signals.quality !== "static");
      if (active) wake();
      else lastTime = 0;
      return active;
    }
    function preferenceChanged() {
      signals.reducedMotion = reducedQuery.matches;
      signals.coarsePointer = !pointerQuery.matches;
      signals.quality = quality();
      refresh();
    }
    function visibilityChanged() {
      signals.visible = !doc.hidden && rootVisible;
      if (!signals.visible) {
        win.cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        sampleSeconds = sampleFrames = 0;
      } else refresh();
      for (const fn of subscribers) fn(signals);
    }
    on(scrollRoot, "scroll", wake, { passive: true });
    on(win, "resize", refresh, { passive: true });
    on(win.visualViewport || win, "resize", refresh, { passive: true });
    on(doc, "pointermove", (e) => {
      pendingPointer = { x: e.clientX, y: e.clientY, active: e.pointerType !== "touch" };
      wake();
    }, { passive: true });
    on(doc, "pointerleave", () => {
      pendingPointer.active = false;
      wake();
    });
    on(win, "blur", () => {
      pendingPointer.active = false;
      wake();
    });
    on(doc, "visibilitychange", visibilityChanged);
    on(reducedQuery, "change", preferenceChanged);
    on(pointerQuery, "change", preferenceChanged);
    const resize = new win.ResizeObserver(refresh);
    resize.observe(root.nodeType === 9 ? doc.documentElement : root);
    disposers.push(() => resize.disconnect());
    if (root.nodeType !== 9) {
      const observer = new win.IntersectionObserver(([entry]) => {
        rootVisible = entry.isIntersecting;
        visibilityChanged();
      });
      observer.observe(root);
      disposers.push(() => observer.disconnect());
    }
    doc.fonts?.ready.then(() => {
      if (!disposed) refresh();
    });
    lastY = readY();
    signals.scroll.y = lastY;
    preferenceChanged();
    return {
      signals,
      tick,
      refresh,
      wake,
      subscribe(fn) {
        subscribers.add(fn);
        wake();
        return () => subscribers.delete(fn);
      },
      read(fn) {
        readers.add(fn);
        wake();
        return () => readers.delete(fn);
      },
      continuous(owner = /* @__PURE__ */ Symbol("animation")) {
        continuous.add(owner);
        wake();
        return () => continuous.delete(owner);
      },
      track(element, { radius = 120 } = {}) {
        const key = /* @__PURE__ */ Symbol("target"), entry = { element, radius, rect: null, value: { amount: 0, x: 0, y: 0, distance: Infinity } };
        targets.set(key, entry);
        resize.observe(element);
        refresh();
        return { get current() {
          return entry.value;
        }, dispose() {
          targets.delete(key);
          resize.unobserve(element);
        } };
      },
      setQuality(value) {
        if (value !== "auto" && !QUALITY[value]) throw new TypeError("Unknown quality tier: " + value);
        requestedQuality = value;
        wake();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        win.cancelAnimationFrame(frame);
        disposers.reverse().forEach((fn) => fn());
        subscribers.clear();
        readers.clear();
        targets.clear();
        continuous.clear();
      }
    };
  }

  // runtime/effects.mjs
  function mountProximity(element, runtime2, options = {}) {
    const variant = options.variant || element.dataset.cinematicProximity || "magnetic";
    const visual = element.querySelector("[data-proximity-visual]") || element;
    const target = runtime2.track(element, { radius: options.radius ?? 120 });
    const original = visual.getAttribute("style");
    let x = 0, y = 0, amount = 0;
    const unsubscribe = runtime2.subscribe((s) => {
      const p = target.current, enabled = s.pointer.active && !s.reducedMotion && s.quality !== "static";
      const strength = options.strength ?? 12;
      const tx = enabled ? p.x * p.amount * strength : 0, ty = enabled ? p.y * p.amount * strength : 0;
      const rate = s.reducedMotion || s.quality === "static" ? 1e5 : 15;
      x = damp(x, tx, rate, s.delta || 1 / 60);
      y = damp(y, ty, rate, s.delta || 1 / 60);
      amount = damp(amount, enabled ? p.amount : 0, rate, s.delta || 1 / 60);
      if (variant === "depth") visual.style.transform = `perspective(900px) rotateX(${-y * 0.35}deg) rotateY(${x * 0.35}deg) translateZ(${amount * 8}px)`;
      else visual.style.transform = `translate3d(${x}px,${y}px,0)`;
      visual.style.setProperty("--cinematic-proximity", String(amount));
      return Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(amount - (enabled ? p.amount : 0)) > 0.01;
    });
    return () => {
      unsubscribe();
      target.dispose();
      if (original === null) visual.removeAttribute("style");
      else visual.setAttribute("style", original);
    };
  }

  // assets/studio-tunnel.mjs
  function createStudioTunnel(canvas, { wake = () => {
  } } = {}) {
    if (!canvas) return null;
    let gl, program, buffer, uniforms, ready = false, lost = false, failed = false, phase = 0, lastTime = 0;
    const theme = matchMedia("(prefers-color-scheme:dark)");
    const random = seededRandom(230), count = 4800, points = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const u = random() * Math.PI * 2, v = random() * Math.PI * 2, r = 15 * (0.74 + random() * 0.26);
      points.set([(60 + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (60 + r * Math.cos(v)) * Math.sin(u), random()], i * 4);
    }
    const vertex = `
 attribute vec4 point;
 uniform float angle,aspect,dpr;
 uniform vec2 pointer;
 varying float tint,depth;
 void main(){
  vec3 radial=vec3(cos(angle),0.,sin(angle));
  vec3 forward=vec3(-sin(angle),0.,cos(angle));
  vec3 eye=radial*(60.+pointer.x*3.)+vec3(0.,pointer.y*2.,0.);
  vec3 relative=point.xyz-eye;
  depth=dot(relative,forward);
  float x=dot(relative,radial),y=relative.y;
  gl_Position=vec4(x*1.14/aspect,y*1.14,depth*.999-.2,depth);
  gl_PointSize=clamp(110.*dpr/max(depth,.1),1.,7.*dpr);
  tint=point.w;
 }`;
    const fragment = `
 precision mediump float;
 uniform vec3 ink,accent;
 varying float tint,depth;
 void main(){
  float radius=length(gl_PointCoord-.5)*2.;
  float edge=1.-smoothstep(.12,1.,radius);
  float fog=1.-smoothstep(30.,115.,depth);
  gl_FragColor=vec4(mix(ink,accent,step(.82,tint)),edge*fog*.65);
 }`;
    function state(value) {
      if (canvas.dataset.state !== value) canvas.dataset.state = value;
    }
    function disposeGPU() {
      if (gl && !lost) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
      buffer = program = null;
      ready = false;
    }
    function init() {
      if (ready || lost || failed) return;
      try {
        gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" });
        if (!gl) throw Error("WebGL unavailable");
        program = gl.createProgram();
        for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw Error("Shader unavailable");
          }
          gl.attachShader(program, shader);
          gl.deleteShader(shader);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error("Program unavailable");
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
        const attr = gl.getAttribLocation(program, "point");
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr, 4, gl.FLOAT, false, 0, 0);
        uniforms = Object.fromEntries(["angle", "aspect", "dpr", "pointer", "ink", "accent"].map((key) => [key, gl.getUniformLocation(program, key)]));
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        ready = true;
      } catch {
        failed = true;
        disposeGPU();
        state("fallback");
      }
    }
    const onLost = (e) => {
      e.preventDefault();
      lost = true;
      ready = false;
      canvas.style.opacity = "0";
      state("fallback");
    };
    const onRestored = () => {
      lost = false;
      failed = false;
      program = buffer = null;
      wake();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return {
      render(s, visibility, paused2) {
        const active = s.visible && !s.reducedMotion && !paused2 && s.quality !== "static" && visibility > 0;
        if (!active) {
          canvas.style.opacity = "0";
          lastTime = s.time;
          state(failed || lost ? "fallback" : "paused");
          return false;
        }
        init();
        if (!ready) {
          lastTime = s.time;
          return false;
        }
        const dpr = Math.min(devicePixelRatio, s.coarsePointer || s.quality === "low" ? 1 : 1.5);
        const width = Math.round(innerWidth * dpr), height = Math.round(innerHeight * dpr);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        phase += Math.min(0.05, Math.max(0, s.time - lastTime)) * 6e-3;
        lastTime = s.time;
        gl.useProgram(program);
        gl.uniform1f(uniforms.angle, s.scroll.progress * Math.PI * 2 + phase);
        gl.uniform1f(uniforms.aspect, innerWidth / innerHeight);
        gl.uniform1f(uniforms.dpr, dpr);
        gl.uniform2f(uniforms.pointer, s.pointer.active && !s.coarsePointer ? (s.pointer.x / innerWidth - 0.5) * 2 : 0, s.pointer.active && !s.coarsePointer ? (0.5 - s.pointer.y / innerHeight) * 2 : 0);
        gl.uniform3fv(uniforms.ink, theme.matches ? [0.64, 0.7, 0.55] : [0.24, 0.3, 0.14]);
        gl.uniform3fv(uniforms.accent, theme.matches ? [0.83, 1, 0.25] : [0.43, 0.56, 0.06]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, s.coarsePointer || s.quality === "low" ? 1800 : count);
        canvas.style.opacity = String(clamp(visibility) * (theme.matches ? 0.75 : 0.42));
        state("playing");
        return true;
      },
      dispose() {
        disposeGPU();
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        canvas.style.opacity = "0";
        state("paused");
      }
    };
  }

  // assets/gallery-motion.mjs
  var runtime = createCinematicRuntime(document);
  var tunnel = createStudioTunnel(document.querySelector("#studio-tunnel"), { wake: () => runtime.wake() });
  var hero = document.querySelector(".hero-stage")?.closest(".hero");
  var stage = hero?.querySelector(".hero-stage");
  var portal = hero?.querySelector(".portal-window");
  var scene = hero?.querySelector(".hero-feature");
  var opening = hero?.querySelector(".hero-opening");
  var heroCopy = hero?.querySelector(".hero-copy");
  var caption = hero?.querySelector(".feature-caption");
  var portalMedia = matchMedia("(min-width:1025px) and (pointer:fine) and (prefers-reduced-motion:no-preference)");
  var heroRect = null;
  var stageRect = null;
  var headerHeight = 76;
  var portalProgress = 0;
  var portalEnabled = false;
  var portalEntryBuffer = 240;
  hero?.style.setProperty("--portal-entry-buffer", portalEntryBuffer + "px");
  function setPortalMode() {
    if (!hero) return;
    const enabled = portalMedia.matches && !paused;
    if (enabled === portalEnabled) return;
    portalEnabled = enabled;
    hero.classList.toggle("portal-enabled", enabled);
    if (!enabled) {
      portal.style.cssText = "";
      scene.style.cssText = "";
      opening.style.cssText = "";
      heroCopy.style.cssText = "";
      caption.style.cssText = "";
      scene.inert = false;
      opening.inert = false;
    }
    runtime.refresh();
  }
  portalMedia.addEventListener("change", setPortalMode);
  hero?.addEventListener("focusin", () => runtime.wake());
  hero?.addEventListener("focusout", () => runtime.wake());
  var entries = [...document.querySelectorAll("[data-gallery-preview]")].map((el) => {
    const video = el.querySelector("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    const target = runtime.track(el, { radius: 110 });
    mountProximity(el, runtime, { variant: "depth", strength: 9, radius: 110 });
    const entry = { el, video, target, rect: null, wanted: false, failed: false, token: 0 };
    video.addEventListener("playing", () => {
      if (entry.wanted) video.classList.add("is-playing");
      else video.pause();
    });
    video.addEventListener("error", () => {
      entry.failed = true;
      video.classList.remove("is-playing");
    });
    el.addEventListener("focusin", () => runtime.wake());
    el.addEventListener("focusout", () => runtime.wake());
    return entry;
  });
  var paused = false;
  var motionToggles = [...document.querySelectorAll("[data-gallery-pause]")];
  for (const button of motionToggles) {
    button.hidden = false;
    button.addEventListener("click", () => {
      paused = !paused;
      for (const control of motionToggles) {
        control.textContent = paused ? "Resume motion" : "Pause motion";
        control.setAttribute("aria-pressed", String(paused));
      }
      runtime.setQuality(paused ? "static" : "auto");
      setPortalMode();
      runtime.wake();
    });
  }
  setPortalMode();
  var artVideo = document.querySelector("[data-art-video]");
  var artEntry = artVideo ? { el: artVideo, video: artVideo, wanted: false, failed: false, token: 0 } : null;
  if (artEntry) {
    artEntry.el.dataset.galleryPreview = matchMedia("(max-width:768px), (pointer:coarse)").matches ? "assets/brand/renaissance-h3-15s-mobile.mp4" : "assets/brand/renaissance-h3-15s.mp4";
    artVideo.addEventListener("playing", () => {
      if (artEntry.wanted) artVideo.classList.add("is-playing");
      else artVideo.pause();
    });
    artVideo.addEventListener("error", () => {
      artEntry.failed = true;
      artVideo.classList.remove("is-playing");
    });
  }
  var stickers = [...document.querySelectorAll("[data-sticker]")].map((el) => ({ el, visual: el.querySelector("[data-sticker-motion]"), rect: null }));
  var artRect = null;
  var stickerTime = 0;
  function playback(entry, wanted) {
    if (entry.wanted === wanted) return;
    entry.wanted = wanted;
    const token = ++entry.token;
    if (!wanted) {
      entry.video.pause();
      entry.video.classList.remove("is-playing");
      return;
    }
    if (entry.failed) return;
    if (!entry.video.getAttribute("src")) entry.video.src = entry.el.dataset.galleryPreview;
    entry.video.play().then(() => {
      if (token !== entry.token && !entry.wanted) entry.video.pause();
    }).catch(() => {
      if (token === entry.token) {
        entry.failed = true;
        entry.video.classList.remove("is-playing");
      }
    });
  }
  var headings = [...document.querySelectorAll(".section-head,.end,.intro")];
  var headingRects = [];
  runtime.read(() => {
    for (const e of entries) e.rect = e.el.getBoundingClientRect();
    headingRects = headings.map((el) => el.getBoundingClientRect());
    for (const e of stickers) e.rect = e.el.getBoundingClientRect();
    artRect = artVideo?.getBoundingClientRect();
    if (hero) {
      heroRect = hero.getBoundingClientRect();
      stageRect = stage.getBoundingClientRect();
      headerHeight = document.querySelector(".site-head").getBoundingClientRect().height;
    }
  });
  runtime.subscribe((s) => {
    const allowed = s.visible && !s.reducedMotion && !paused;
    if (hero && portalEnabled) {
      const travel = Math.max(1, heroRect.height - stageRect.height);
      const baseTravel = Math.max(1, travel - portalEntryBuffer);
      const entryEnd = baseTravel * 0.45 + portalEntryBuffer;
      const distance = Math.max(0, headerHeight - heroRect.top);
      portalProgress = clamp(distance < entryEnd ? distance / entryEnd * 0.45 : (distance - portalEntryBuffer) / baseTravel);
      const reveal = clamp((portalProgress - 0.2) / 0.5), ease = reveal ** 2.6;
      const w = stageRect.width, h = stageRect.height;
      const k = 1 + (Math.max(w / 160 * 2.6, h / 220 * 3) - 1) * ease;
      const x = w * (0.84 - 0.34 * ease) - 80 * k, y = h * (0.61 - 0.11 * ease) - 110 * k;
      portal.style.transform = `translate3d(${x}px,${y}px,0) scale(${k})`;
      portal.style.opacity = String(clamp(reveal * 12));
      if (scene.style.width !== w + "px") scene.style.width = w + "px";
      if (scene.style.height !== h + "px") scene.style.height = h + "px";
      scene.style.transform = `scale(${1 / k}) translate3d(${-x}px,${-y}px,0)`;
      caption.style.opacity = String(clamp((reveal - 0.72) / 0.28));
      heroCopy.style.opacity = String(1 - clamp((reveal - 0.2) / 0.24));
      scene.inert = reveal < 0.99;
      opening.inert = reveal >= 0.44;
    }
    if (artEntry) playback(artEntry, Boolean(allowed && artRect.bottom > 0 && artRect.top < innerHeight && (!portalEnabled || portalProgress < 0.7)));
    let animateStickers = false;
    if (allowed) stickerTime += s.delta;
    stickers.forEach((entry, i) => {
      const active = allowed && entry.rect.bottom > 0 && entry.rect.top < innerHeight;
      animateStickers || (animateStickers = active);
      entry.visual.style.transform = active ? `translateY(${Math.sin(stickerTime * 1.2 + i) * 4}px) rotate(${Math.sin(stickerTime * 0.75 + i) * 4}deg)` : "none";
    });
    const visible = entries.filter((e) => e.rect.bottom > 70 && e.rect.top < innerHeight && e.rect.width > 0);
    let chosen = null;
    if (allowed) {
      chosen = visible.find((e) => e.el.contains(document.activeElement));
      if (!chosen && s.pointer.active) chosen = visible.filter((e) => !e.el.hasAttribute("data-autopreview") && e.target.current.amount > 0.08).sort((a, b) => a.target.current.distance - b.target.current.distance)[0];
      if (!chosen && s.coarsePointer) chosen = visible.filter((e) => !e.el.hasAttribute("data-autopreview") && e.rect.top < innerHeight * 0.7 && e.rect.bottom > innerHeight * 0.3).sort((a, b) => Math.abs((a.rect.top + a.rect.bottom) / 2 - innerHeight / 2) - Math.abs((b.rect.top + b.rect.bottom) / 2 - innerHeight / 2))[0];
    }
    for (const e of entries) {
      const behindPortal = portalEnabled && scene?.contains(e.el) && portalProgress <= 0.2;
      playback(e, Boolean(allowed && !behindPortal && visible.includes(e) && (e === chosen || e.el.hasAttribute("data-autopreview"))));
      const media = e.el.querySelector(".gallery-media");
      if (media) {
        const offset = allowed ? clamp((innerHeight / 2 - (e.rect.top + e.rect.height / 2)) / innerHeight, -1, 1) * 22 : 0;
        media.style.transform = `translate3d(0,${offset}px,0) scale(${allowed ? 1.055 : 1})`;
      }
    }
    headings.forEach((el, i) => {
      const r = headingRects[i], p = allowed ? clamp((r.top - innerHeight * 0.6) / (innerHeight * 0.4)) : 0;
      el.style.transform = `translate3d(0,${p * 28}px,0)`;
      el.style.opacity = String(1 - p * 0.45);
    });
    const art = document.querySelector(".studio-art-plane");
    if (art) art.style.transform = allowed ? `translate3d(${s.pointer.active && !s.coarsePointer ? (s.pointer.x / innerWidth - 0.5) * 12 : 0}px,${Math.min(s.scroll.y, 600) * 0.03}px,0)` : "none";
    const progress = document.querySelector(".site-head .progress");
    if (progress) progress.style.transform = `scaleX(${s.scroll.progress})`;
    const tunnelActive = tunnel?.render(s, heroRect ? clamp((innerHeight - heroRect.bottom) / 250) : 0, paused);
    return animateStickers || tunnelActive;
  });
  addEventListener("pagehide", (event) => {
    for (const e of entries) playback(e, false);
    if (artEntry) playback(artEntry, false);
    if (!event.persisted) tunnel?.dispose();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      for (const e of entries) playback(e, false);
      if (artEntry) playback(artEntry, false);
    } else runtime.wake();
  });
  addEventListener("pageshow", () => runtime.refresh());
  var directory = document.querySelector(".studio-directory");
  if (directory) {
    const summary = directory.querySelector("summary");
    directory.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      directory.open = false;
      if (target.hidden && search) {
        search.value = "";
        search.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (!target.hasAttribute("tabindex")) {
        target.tabIndex = -1;
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
      location.hash = link.hash;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start", behavior: "instant" });
      runtime.refresh();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && directory.open) {
        directory.open = false;
        summary.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!directory.contains(e.target)) directory.open = false;
    });
    directory.addEventListener("focusout", (e) => {
      if (e.relatedTarget && !directory.contains(e.relatedTarget)) directory.open = false;
    });
  }
  var picker = document.querySelector(".agent-picker");
  if (picker) {
    picker.hidden = false;
    picker.addEventListener("click", (e) => {
      const button = e.target.closest("[data-agent]");
      if (!button) return;
      for (const option of picker.querySelectorAll("button")) option.setAttribute("aria-pressed", String(option === button));
      const agent = button.dataset.agent;
      document.querySelector("#install-command").textContent = "npx skills add MustBeSimo/cinematic-scroll-skill" + (agent ? " --agent " + agent : "");
      document.querySelector("#agent-install-note").textContent = agent ? `Install for ${button.textContent} in this project.` : "The installer lets you choose from its supported coding agents.";
      runtime.refresh();
    });
  }
  var search = document.querySelector("#project-search");
  if (search) {
    document.querySelector(".project-toolbar").hidden = false;
    const cards = [...document.querySelectorAll(".project-card")];
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      let total = 0;
      for (const card of cards) {
        card.hidden = !`${card.dataset.project} ${card.textContent}`.toLowerCase().includes(query);
        if (!card.hidden) total++;
      }
      for (const id of ["flagships", "worlds"]) {
        const section = document.getElementById(id);
        const count = section.querySelectorAll(".project-card:not([hidden])").length;
        section.hidden = count === 0;
        document.querySelector(`[data-count-for="${id}"]`).textContent = `${count} project${count === 1 ? "" : "s"}`;
      }
      document.getElementById("project-result-count").textContent = `${total} project${total === 1 ? "" : "s"}`;
      document.querySelector(".project-empty").hidden = total > 0;
      runtime.refresh();
    });
    document.querySelectorAll(".project-prompt").forEach((el) => el.addEventListener("toggle", () => runtime.refresh()));
  }
})();
