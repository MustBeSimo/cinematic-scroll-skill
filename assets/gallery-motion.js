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

  // assets/gallery-motion.mjs
  var runtime = createCinematicRuntime(document);
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
  var toggle = document.querySelector("[data-gallery-pause]");
  if (toggle) {
    toggle.hidden = false;
    toggle.textContent = "Pause previews";
    toggle.addEventListener("click", () => {
      paused = !paused;
      toggle.textContent = paused ? "Resume previews" : "Pause previews";
      toggle.setAttribute("aria-pressed", String(paused));
      runtime.setQuality(paused ? "static" : "auto");
      runtime.wake();
    });
  }
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
  });
  runtime.subscribe((s) => {
    const allowed = s.visible && !s.reducedMotion && !paused;
    const visible = entries.filter((e) => e.rect.bottom > 70 && e.rect.top < innerHeight && e.rect.width > 0);
    let chosen = null;
    if (allowed) {
      chosen = visible.find((e) => e.el.contains(document.activeElement));
      if (!chosen && s.pointer.active) chosen = visible.filter((e) => !e.el.hasAttribute("data-autopreview") && e.target.current.amount > 0.08).sort((a, b) => a.target.current.distance - b.target.current.distance)[0];
      if (!chosen && s.coarsePointer) chosen = visible.filter((e) => !e.el.hasAttribute("data-autopreview") && e.rect.top < innerHeight * 0.7 && e.rect.bottom > innerHeight * 0.3).sort((a, b) => Math.abs((a.rect.top + a.rect.bottom) / 2 - innerHeight / 2) - Math.abs((b.rect.top + b.rect.bottom) / 2 - innerHeight / 2))[0];
    }
    for (const e of entries) {
      playback(e, Boolean(allowed && visible.includes(e) && (e === chosen || e.el.hasAttribute("data-autopreview"))));
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
  });
  addEventListener("pagehide", () => {
    for (const e of entries) playback(e, false);
  });
  addEventListener("pageshow", () => runtime.refresh());
  var directory = document.querySelector(".studio-directory");
  if (directory) {
    const summary = directory.querySelector("summary");
    directory.addEventListener("click", (e) => {
      if (e.target.closest("a")) directory.open = false;
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
      if (!directory.contains(e.relatedTarget)) directory.open = false;
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
