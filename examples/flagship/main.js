/* ===========================================================================
   cinematic-scroll · FLAGSHIP ENGINE (Mode A — vanilla Three.js 0.160.0)

   One scroll-driven cinematic narrative. ONE WebGLRenderer, ONE canvas, ONE
   scene graph, four chapters the camera travels between as you scroll:

     1. OBJECT  — premium product showcase. Procedural faceted "watch-like"
                  beveled prism, PBR metal/rough, slow auto-rotate +
                  scroll-driven explode/reassemble. AR quick-look (model-viewer).
     2. WORLD   — environment fly-through. Instanced modular hall (columns +
                  blocks), scroll dolly along a CatmullRom path, atmospheric fog.
                  WebXR immersive Enter-VR (feature-detected).
     3. FIELD   — abstract procedural SHADER. A full custom ShaderMaterial
                  (GLSL) — a flowing GPU field reacting to scroll progress.
                  ZERO assets; the always-works hero chapter.
     4. FIGURE  — avatar. Stylized humanoid built from primitives, gentle idle.
                  WebXR + AR quick-look. Real rigged .glb drops in via manifest.

   ENGINEERING CONTRACT (cinematic-doctor + references/3d-stack.md + webxr.md):
     • devicePixelRatio clamped <= 2 (1.5 on mobile)            — boot + here
     • DOM overlays animate transform/opacity only; camera on rAF only
     • webglcontextlost + webglcontextrestored handled          — boot + here
     • WebGL feature-detected; CSS fallback if unsupported      — boot
     • XR: navigator.xr detected BEFORE any Enter-VR/AR button  — boot + here
     • prefers-reduced-motion → one static frame, no loop
     • rAF paused when document hidden OR canvas off-screen (IO)
     • dispose geometries/materials on teardown; object counts capped
     • mobile → reduced scene complexity + lower pixelRatio

   The procedural geometry is the live placeholder for Tier-B chapters: when a
   real .glb path resolves in assets-3d/manifest.json the loader swaps it in
   with ZERO code change (see loadChapterModel()).
   =========================================================================== */

import * as THREE from 'three';

const BOOT = window.__FLAGSHIP__ || {
  webglOK: true, reduce: false, isTouch: false,
  isMobile: () => innerWidth <= 680,
  pixelRatio: () => Math.min(devicePixelRatio || 1, innerWidth <= 680 ? 1.5 : 2),
  xrSupport: () => Promise.resolve({ vr: false, ar: false }),
  showFallback() {}, hideFallback() {},
  canvas: document.getElementById('gl-canvas'),
};

// If WebGL is unavailable the boot script already revealed the CSS fallback.
// Build the DOM chapters anyway (text/legibility), but never touch WebGL.
const reduce = BOOT.reduce;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (e0, e1, x) => { if (x <= e0) return 0; if (x >= e1) return 1; const t = (x - e0) / (e1 - e0); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------------------------------------------------------------------
   CHAPTER MANIFEST (DOM side). The 3D manifest (models/usdz/scale/cameraNodes)
   lives in assets-3d/manifest.json and is fetched at boot; this drives copy.
   --------------------------------------------------------------------------- */
const CHAPTERS = [
  {
    id: 'object', roman: '01', eyebrow: 'MOVEMENT I · THE OBJECT',
    title: [['PRECISION', 0], ['IN FORM', 1]],
    lede: 'A single artifact, machined from one idea. The camera orbits as the form breathes apart and reassembles — every facet catching the light it was cut for. A premium product, rendered in real time, placeable on your desk at true scale.',
    morph: 'radial-gradient(120% 90% at 70% 12%, rgba(61,224,255,.10), rgba(61,224,255,0) 55%), radial-gradient(120% 100% at 50% 100%, rgba(5,6,11,.7), rgba(5,6,11,0) 60%)',
    cue: true, ar: true, enter: 'mask',
  },
  {
    id: 'world', roman: '02', eyebrow: 'MOVEMENT II · THE WORLD',
    title: [['INTO THE', 0], ['HALL', 1]],
    lede: 'A modular architecture assembled from instanced light — colonnade after colonnade receding into atmospheric haze. Scroll is the dolly: the camera flies the length of the hall on an authored path. Enter it at room scale in VR.',
    morph: 'radial-gradient(130% 100% at 30% 10%, rgba(27,58,102,.32), rgba(7,10,20,0) 58%), radial-gradient(90% 70% at 88% 92%, rgba(61,224,255,.10), rgba(61,224,255,0) 55%)',
    vr: true, enter: 'rise',
  },
  {
    id: 'field', roman: '03', eyebrow: 'MOVEMENT III · THE FIELD',
    title: [['THE MATH', 0], ['IS THE IMAGE', 1]],
    lede: 'No model, no texture, no asset to 404 — only a custom GLSL field running on the GPU, flowing and folding in answer to your scroll. This is the always-works hero: it degrades by lowering resolution, never by going blank.',
    morph: 'radial-gradient(120% 100% at 50% 0%, rgba(36,21,70,.5), rgba(7,10,20,0) 60%), radial-gradient(70% 60% at 50% 60%, rgba(61,224,255,.14), rgba(61,224,255,0) 60%)',
    enter: 'scale',
  },
  {
    id: 'figure', roman: '04', eyebrow: 'MOVEMENT IV · THE FIGURE',
    title: [['MEET THE', 0], ['FIGURE', 1]],
    lede: 'A presence built from primitives, holding a gentle idle — a stand-in for a rigged avatar that drops in via the manifest with zero code change. Stand beside it in AR, or step into the same space in VR.',
    morph: 'radial-gradient(120% 100% at 70% 14%, rgba(255,178,112,.10), rgba(255,178,112,0) 52%), radial-gradient(110% 90% at 24% 100%, rgba(36,21,70,.42), rgba(7,10,20,0) 60%)',
    cta: 'View the source', ar: true, vr: true, enter: 'track',
  },
];

/* ---------------------------------------------------------------------------
   BUILD THE DOM (sections + rail). Content is visible by default; the engine
   only enhances it. transform/opacity are the only animated DOM properties.
   --------------------------------------------------------------------------- */
const reel = document.getElementById('reel');
const rail = document.getElementById('rail');
const atmos = document.getElementById('atmos');
const bar = document.getElementById('scrollbar');

function buildDOM() {
  for (const ch of CHAPTERS) {
    const sec = document.createElement('section');
    sec.id = ch.id;
    sec.dataset.chapter = ch.id;
    sec.dataset.morph = ch.morph;
    if (ch.enter) sec.dataset.enter = ch.enter;   // per-chapter entrance treatment (anti-convergence)

    const titleHTML = ch.title.map(([txt, acc]) =>
      `<span class="ln"><span class="t${acc ? ' accent' : ''}">${txt}</span></span>`
    ).join('');

    // per-chapter actions: AR quick-look + Enter-VR are injected later, only
    // after feature-detection resolves (never a dead button).
    sec.innerHTML = `
      <div class="stage">
        <div class="roman" data-depth="0.30" aria-hidden="true">${ch.roman}</div>
        <div class="copytext" data-depth="1.0">
          <div class="eyebrow reveal">${ch.eyebrow}</div>
          <h2 class="title">${titleHTML}</h2>
          <p class="lede"><span class="reveal">${ch.lede}</span></p>
          <div class="actions" data-actions="${ch.id}">
            ${ch.cta ? `<a class="btn primary reveal" href="https://github.com/MustBeSimo/cinematic-scroll-skill"><span class="dot"></span>${ch.cta}</a>` : ''}
          </div>
        </div>
        ${ch.cue ? `<div class="cuewrap" data-depth="1.4">
          <div class="cue"><span class="dot"></span>Scroll to travel</div>
          <span class="bar"></span>
        </div>` : ''}
      </div>`;
    reel.appendChild(sec);

    const r = document.createElement('button');
    r.className = 'r'; r.type = 'button'; r.dataset.id = ch.id;
    r.setAttribute('aria-label', `Go to ${ch.id}`);
    r.innerHTML = `<span class="num">${ch.roman}</span><span class="ln" aria-hidden="true"></span>`;
    rail.appendChild(r);
  }
}
buildDOM();

const sections = [...document.querySelectorAll('section')];
const rails = [...rail.querySelectorAll('.r')];

rails.forEach((r) => r.addEventListener('click', () => {
  document.getElementById(r.dataset.id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* background-morph + active rail via whichever section crosses screen-center.
   Sections are taller than the viewport, so collapse the IO root to a 1px band
   at the vertical center with rootMargin. */
function applyActive(sec) {
  const idx = sections.indexOf(sec);
  atmos.style.background = sec.dataset.morph;
  rails.forEach((r, i) => r.classList.toggle('on', i === idx));
}
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) applyActive(e.target); });
}, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
sections.forEach((s) => spy.observe(s));
applyActive(sections[0]);

/* top scroll-progress bar — scaleX only (transform, never width). */
let pTick = false;
function progress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
  pTick = false;
}
function queueProgress() { if (!pTick) { pTick = true; requestAnimationFrame(progress); } }
addEventListener('scroll', queueProgress, { passive: true });
progress();

/* DOM text reveal — one-shot on enter (transform/opacity), staggered. Skipped
   under reduced motion (CSS already shows everything). */
if (!reduce) {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  const revealEl = (el, delay) => {
    el.style.transition = `opacity 800ms var(--curve-cinematic) ${delay}ms, transform 800ms var(--curve-cinematic) ${delay}ms`;
    el.style.opacity = '0';
    el.style.transform = 'translate3d(0,26px,0)';
    io.observe(el);
  };
  sections.forEach((sec) => {
    let i = 0;
    sec.querySelectorAll('h2 .ln .t').forEach((t) => revealEl(t, (i++) * 80));
    sec.querySelectorAll('.copytext .reveal').forEach((el) => revealEl(el, (i++) * 80));
  });
}

/* ===========================================================================
   THE WEBGL ENGINE. Everything below only runs if WebGL is available. The DOM
   above stands on its own; if we never get here the page is still complete.
   =========================================================================== */
if (BOOT.webglOK) {
  startEngine().catch((err) => {
    // any failure constructing the renderer → graceful CSS fallback, page intact
    console.warn('[flagship] WebGL engine failed, using CSS fallback:', err);
    BOOT.showFallback();
  });
}

async function startEngine() {
  const canvas = BOOT.canvas || document.getElementById('gl-canvas');
  if (!canvas) return;

  // ── manifest (3D side): models/usdz/scale; loader swaps placeholders ────
  let manifest = null;
  try {
    const res = await fetch('assets-3d/manifest.json', { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch (e) { /* file:// or offline → placeholders, which is the default */ }

  // ── renderer (ONE instance, clamped DPR, cinematic color) ───────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !BOOT.isMobile(),     // MSAA only off the budget tier
    alpha: true,
    powerPreference: BOOT.isMobile() ? 'default' : 'high-performance',
  });
  renderer.setPixelRatio(BOOT.pixelRatio());            // <= 2 desktop, <= 1.5 mobile
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x05060b, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;                           // required before VRButton

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060b, 0.045);

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 1.4, 7);

  // chapter anchors along -Z; the scroll camera travels between them
  const CH_GAP = 16;
  const anchors = CHAPTERS.map((_, i) => new THREE.Vector3(0, 1.4, -i * CH_GAP));

  // ── lighting (cinematic key + cyan rim + soft fill) ─────────────────────
  const key = new THREE.DirectionalLight(0xeaf2f6, 2.1);
  key.position.set(4, 8, 6);
  const rim = new THREE.DirectionalLight(0x3de0ff, 2.6);
  rim.position.set(-6, 3, -4);
  const fill = new THREE.HemisphereLight(0x1b3a66, 0x070a14, 0.6);
  const amber = new THREE.PointLight(0xffb270, 0, 18);   // FIGURE warm accent (lit per-chapter)
  scene.add(key, rim, fill, amber);

  // a tiny procedural env map so PBR metal has something to reflect (no asset)
  const envMap = buildEnvMap(renderer);
  scene.environment = envMap;

  // ── disposables registry: every geometry/material/texture we create ─────
  const disposables = [envMap];
  const track = (obj) => { disposables.push(obj); return obj; };

  // ── BUILD THE FOUR CHAPTER GROUPS (procedural placeholders) ─────────────
  const groups = [];

  // 1 · OBJECT — faceted beveled prism, slow rotate + explode/reassemble
  const objectChapter = buildObjectChapter(track);
  objectChapter.group.position.copy(anchors[0]).add(new THREE.Vector3(0, 0.1, -1.5));
  scene.add(objectChapter.group);
  groups.push(objectChapter);

  // 2 · WORLD — instanced modular hall + authored camera path
  const worldChapter = buildWorldChapter(track, anchors[1]);
  scene.add(worldChapter.group);
  groups.push(worldChapter);

  // 3 · FIELD — full custom ShaderMaterial GPU field (zero assets)
  const fieldChapter = buildFieldChapter(track, anchors[2]);
  scene.add(fieldChapter.group);
  groups.push(fieldChapter);

  // 4 · FIGURE — stylized humanoid from primitives, gentle idle
  const figureChapter = buildFigureChapter(track, anchors[3]);
  scene.add(figureChapter.group);
  groups.push(figureChapter);

  // expose hooks for the boot context-loss handlers
  window.__FLAGSHIP_ENGINE__ = {
    onContextLost() { running = false; },
    onContextRestored() {
      renderer.setPixelRatio(BOOT.pixelRatio());
      renderer.setSize(innerWidth, innerHeight, false);
      running = true;
      if (!reduce) startLoop(); else renderOnce();
    },
  };

  // ── FX layer: rail dust + light shafts + stage rings (zero assets) ──────
  const fx = buildFXLayer(track, anchors, scene);
  const mixers = [];   // AnimationMixers for any rigged GLB the manifest loads

  // ── try to upgrade Tier-B chapters from the manifest (zero code change) ──
  // runtime:"procedural" → keep procedural. A real .glb path → load + replace.
  upgradeFromManifest(manifest, groups, track, scene, mixers).catch(() => { /* keep placeholders */ });

  // ── XR + AR affordances — feature-detected BEFORE any button is shown ───
  await mountXRAndAR(renderer, manifest);

  // ── responsive + pause gating ───────────────────────────────────────────
  let resizeTO = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(BOOT.pixelRatio());
      renderer.setSize(innerWidth, innerHeight, false);
      fieldChapter.setResolution(innerWidth, innerHeight, BOOT.pixelRatio());
      if (reduce) renderOnce();
    }, 150);
  }, { passive: true });

  // pause rAF when tab hidden OR the canvas is off-screen
  let tabVisible = !document.hidden;
  let onScreen = true;
  document.addEventListener('visibilitychange', () => {
    tabVisible = !document.hidden;
    if (tabVisible && running && !reduce) startLoop();
  });
  const stageIO = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && running && !reduce) startLoop();
  }, { threshold: 0 });
  stageIO.observe(document.getElementById('gl-stage'));

  // ── scroll → normalized progress (0..1) across the whole reel ───────────
  // ScrollTrigger isn't loaded in Mode A; we read scroll directly (cheap) and
  // write a single number. The rAF loop lerps the camera toward it.
  let target = 0;     // scroll-derived target progress
  let current = 0;    // lerped value the camera actually uses
  function readScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    target = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();
  current = target;

  // ── the render loop (XR-safe via setAnimationLoop) ──────────────────────
  let running = true;
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function updateScene(dt, t) {
    const time = clock.elapsedTime;
    // camera travels the chapter anchors; t in [0,1] maps across (N-1) gaps
    const span = (CHAPTERS.length - 1);
    const f = t * span;                  // 0..span
    const i = clamp(Math.floor(f), 0, span - 1);
    const local = f - i;                 // 0..1 within the current leg
    camTarget.copy(anchors[i]).lerp(anchors[i + 1], smooth(0, 1, local));
    camTarget.x += Math.sin(t * Math.PI * 2) * 0.6;     // gentle lateral drift
    camTarget.y += 0.25 * Math.sin(t * Math.PI * 3);

    if (!renderer.xr.isPresenting) {
      // time-based damping (~0.2s constant) — a per-frame factor would run 2x
      // faster at 120 Hz and never converge under load.
      camera.position.lerp(camTarget, reduce ? 1 : 1 - Math.exp(-4.8 * Math.max(dt, 1e-4)));
      lookTarget.set(0, 1.2, camTarget.z - 6);
      camera.lookAt(lookTarget);
    }

    // per-chapter progress (each chapter "owns" a slice of t)
    groups.forEach((g, idx) => {
      const c0 = (idx - 0.5) / span;
      const c1 = (idx + 0.5) / span;
      const cp = clamp((t - c0) / Math.max(1e-4, c1 - c0), 0, 1);
      const near = 1 - clamp(Math.abs(t - idx / span) * span, 0, 1); // 1 when centered
      g.update(time, dt, cp, near);
    });

    // FIGURE warm accent only when the figure is roughly on-screen
    const figNear = 1 - clamp(Math.abs(t - 3 / span) * span, 0, 1);
    amber.intensity = 2.4 * figNear;
    amber.position.copy(anchors[3]).add(new THREE.Vector3(2, 2.5, 2));

    // rigged GLBs: advance their clips (the dancer's samba)
    for (const mx of mixers) mx.update(dt);

    // travel velocity (0 at a dwell, →1 in fast transit) feeds the FX layer
    const rawVel = reduce ? 0 : clamp((Math.abs(target - current) / Math.max(dt, 1e-4)) * 10, 0, 1);
    fx.update(time, dt, rawVel);

    // FOV kick — the lens widens a touch at speed, settles to 46° at dwells
    if (!renderer.xr.isPresenting && !reduce) {
      const fovTarget = 46 + fx.velocity * 6;
      if (Math.abs(camera.fov - fovTarget) > 0.01) {
        camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-4.8 * Math.max(dt, 1e-4)));
        camera.updateProjectionMatrix();
      }
    }
  }

  let loopArmed = false;
  function startLoop() {
    if (loopArmed) return;
    loopArmed = true;
    renderer.setAnimationLoop(() => {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const presenting = renderer.xr.isPresenting;
      if (!presenting && (!onScreen || !tabVisible)) {
        // paused: stop driving the loop until visibility returns
        renderer.setAnimationLoop(null);
        loopArmed = false;
        return;
      }
      current += (target - current) * (reduce ? 1 : 1 - Math.exp(-5.5 * dt));
      updateScene(dt, presenting ? clamp(current, 0, 1) : current);
      renderer.render(scene, camera);
    });
  }
  function renderOnce() {
    // reduced motion: compose ONE frame at the current scroll position, hold it
    current = target;
    updateScene(0, current);
    renderer.render(scene, camera);
  }

  if (reduce) {
    // no continuous loop; render a single static frame and re-render only on
    // explicit scroll (still discrete — never a rAF animation).
    renderOnce();
    addEventListener('scroll', () => { readScroll(); renderOnce(); }, { passive: true });
  } else {
    startLoop();
  }

  // ── teardown (kept for completeness / SPA hosting): dispose all GL ───────
  window.__FLAGSHIP_DISPOSE__ = function dispose() {
    running = false;
    renderer.setAnimationLoop(null);
    disposables.forEach((d) => { try { d.dispose && d.dispose(); } catch (e) {} });
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    renderer.dispose();
  };
}

/* ===========================================================================
   CHAPTER BUILDERS — procedural placeholders (Tier-C geometry that doubles as
   the Tier-B stand-in until a real .glb arrives). Each returns:
     { group, update(time, dt, chapterProgress, nearness), [setResolution] }
   =========================================================================== */

/* 1 · OBJECT — a beveled faceted prism ("watch-like" premium form). The body
   is split into stacked segments that explode outward then reassemble with
   scroll; PBR metal/rough catches the cyan rim + env map. */
function buildObjectChapter(track) {
  const group = new THREE.Group();
  const SEG = 7;                    // capped segment count
  const segs = [];
  const baseMat = track(new THREE.MeshStandardMaterial({
    color: 0x9fb4c4, metalness: 0.92, roughness: 0.22,
    envMapIntensity: 1.2,
  }));
  const accentMat = track(new THREE.MeshStandardMaterial({
    color: 0x3de0ff, metalness: 0.6, roughness: 0.18,
    emissive: 0x0a3a48, emissiveIntensity: 0.6,
  }));
  for (let i = 0; i < SEG; i++) {
    const r = 0.9 - i * 0.06;
    const geo = track(new THREE.CylinderGeometry(r, r * 0.96, 0.16, 8, 1, false));
    const mat = (i === 3) ? accentMat : baseMat;     // one accent band
    const m = new THREE.Mesh(geo, mat);
    m.position.y = (i - (SEG - 1) / 2) * 0.18;
    m.userData.baseY = m.position.y;
    m.userData.dir = (i - (SEG - 1) / 2);
    group.add(m);
    segs.push(m);
  }
  // a crowning faceted gem on top
  const gemGeo = track(new THREE.IcosahedronGeometry(0.34, 0));
  const gem = new THREE.Mesh(gemGeo, baseMat);
  gem.position.y = (SEG - 1) / 2 * 0.18 + 0.28;
  group.add(gem);
  segs.push(gem);

  group.userData.replaceable = true;   // marks the procedural placeholder

  function update(time, dt, cp, near) {
    group.rotation.y += dt * 0.35;      // slow auto-rotate
    // explode/reassemble: peaks mid-chapter then settles
    const ex = Math.sin(cp * Math.PI);
    segs.forEach((m) => {
      const d = m.userData.dir || 0;
      m.position.y = (m.userData.baseY ?? m.position.y) + d * ex * 0.22;
    });
    group.scale.setScalar(lerp(0.85, 1, near));
  }
  return { group, update };
}

/* 2 · WORLD — an instanced modular hall: two colonnades of pillars + a coffered
   ceiling grid, all via InstancedMesh (1 draw call per type, not N). The camera
   flies through; nodes named cam_* in the manifest can author the path. */
function buildWorldChapter(track, anchor) {
  const BAYS = BOOT.isMobile() ? 8 : 14;     // reduced complexity on mobile
  const group = new THREE.Group();
  group.position.copy(anchor);

  const pillarGeo = track(new THREE.BoxGeometry(0.5, 5, 0.5));
  const pillarMat = track(new THREE.MeshStandardMaterial({ color: 0x2a3550, metalness: 0.35, roughness: 0.65, envMapIntensity: 0.6 }));
  const COLS = 2;
  const pillars = new THREE.InstancedMesh(pillarGeo, pillarMat, BAYS * COLS);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let b = 0; b < BAYS; b++) {
    for (let s = 0; s < COLS; s++) {
      const x = s === 0 ? -3.2 : 3.2;
      const z = -b * 2.4;
      m4.makeTranslation(x, 0, z);
      pillars.setMatrixAt(n++, m4);
    }
  }
  pillars.instanceMatrix.needsUpdate = true;
  group.add(pillars);

  // coffered ceiling beams (instanced)
  const beamGeo = track(new THREE.BoxGeometry(8, 0.3, 0.3));
  const beamMat = track(new THREE.MeshStandardMaterial({ color: 0x1b2540, metalness: 0.4, roughness: 0.55 }));
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, BAYS);
  for (let b = 0; b < BAYS; b++) {
    m4.makeTranslation(0, 2.6, -b * 2.4);
    beams.setMatrixAt(b, m4);
  }
  beams.instanceMatrix.needsUpdate = true;
  group.add(beams);

  // glowing floor strip (cyan runway leading the eye through the hall)
  const stripGeo = track(new THREE.PlaneGeometry(0.5, BAYS * 2.4 + 4));
  const stripMat = track(new THREE.MeshBasicMaterial({ color: 0x3de0ff, transparent: true, opacity: 0.35 }));
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, -2.46, -(BAYS * 2.4) / 2 + 1);
  group.add(strip);

  // floating motes (instanced points-ish via small boxes, capped)
  const moteGeo = track(new THREE.BoxGeometry(0.05, 0.05, 0.05));
  const moteMat = track(new THREE.MeshBasicMaterial({ color: 0x8bf3ff }));
  const MOTES = BOOT.isMobile() ? 24 : 60;
  const motes = new THREE.InstancedMesh(moteGeo, moteMat, MOTES);
  const motePos = [];
  for (let i = 0; i < MOTES; i++) {
    const p = new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 4 - 1, -Math.random() * BAYS * 2.4);
    motePos.push(p);
    m4.makeTranslation(p.x, p.y, p.z);
    motes.setMatrixAt(i, m4);
  }
  motes.instanceMatrix.needsUpdate = true;
  group.add(motes);

  // authored camera path nodes (the manifest can override these names later)
  group.userData.cameraNodes = ['cam_start', 'cam_01', 'cam_02', 'cam_end'];

  function update(time, dt, cp, near) {
    strip.material.opacity = 0.25 + 0.25 * (0.5 + 0.5 * Math.sin(time * 1.5));
    for (let i = 0; i < MOTES; i++) {
      const p = motePos[i];
      p.y += dt * 0.3;
      if (p.y > 3) p.y = -1;
      m4.makeTranslation(p.x, p.y, p.z);
      motes.setMatrixAt(i, m4);
    }
    motes.instanceMatrix.needsUpdate = true;
  }
  return { group, update };
}

/* 3 · FIELD — a full custom ShaderMaterial (GLSL). A domain-warped flow field
   rendered on a large quad facing the camera; uScroll drives the fold. ZERO
   assets. This is the always-works hero. Degrades by resolution, not by going
   blank. */
function buildFieldChapter(track, anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor);

  const geo = track(new THREE.PlaneGeometry(28, 18, 1, 1));
  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uNear: { value: 1 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uColorA: { value: new THREE.Color(0x0e1a38) },
    uColorB: { value: new THREE.Color(0x3de0ff) },
    uColorC: { value: new THREE.Color(0x241546) },
  };
  const mat = track(new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uScroll;
      uniform float uNear;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;

      // hash + value noise
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
        return v;
      }
      void main(){
        vec2 uv = vUv * 3.0;
        float t = uTime * 0.15;
        // domain warp — folds harder as you scroll into the chapter
        float warp = 0.6 + uScroll * 1.6;
        vec2 q = vec2(fbm(uv + t), fbm(uv - t + 5.2));
        vec2 r = vec2(fbm(uv + warp*q + vec2(1.7,9.2) + t),
                      fbm(uv + warp*q + vec2(8.3,2.8) - t));
        float f = fbm(uv + warp*r);

        // flowing ridged bands
        float bands = sin((f*6.0 + uScroll*4.0 + uTime*0.4)) * 0.5 + 0.5;
        bands = pow(bands, 2.0);

        vec3 col = mix(uColorA, uColorC, f);
        col = mix(col, uColorB, bands * (0.4 + 0.6*uScroll));
        // cyan filaments
        col += uColorB * smoothstep(0.78, 0.82, f) * 0.8;

        float vig = smoothstep(1.1, 0.2, length(vUv - 0.5));
        float alpha = (0.35 + 0.55*bands) * vig * uNear;   // fade with proximity
        gl_FragColor = vec4(col, alpha);
      }
    `,
  }));
  const quad = new THREE.Mesh(geo, mat);
  quad.position.set(0, 1.2, 2);   // sits just in front of the chapter anchor,
  // faces +Z toward the camera (which looks down -Z) — no per-frame lookAt,
  // so the loop allocates nothing (3d-stack.md §5).
  group.add(quad);

  function update(time, dt, cp, near) {
    uniforms.uTime.value = time;
    uniforms.uScroll.value = lerp(uniforms.uScroll.value, cp, 0.1);
    uniforms.uNear.value = near;    // fade the field with proximity
  }
  function setResolution(w, h, dpr) { uniforms.uRes.value.set(w * dpr, h * dpr); }
  return { group, update, setResolution };
}

/* 4 · FIGURE — a stylized humanoid silhouette from primitives, gentle idle
   (breathing weight-shift). Stand-in for a rigged avatar dropped via manifest. */
function buildFigureChapter(track, anchor) {
  const group = new THREE.Group();
  group.position.copy(anchor);
  group.position.y = -1;             // feet near floor

  const skin = track(new THREE.MeshStandardMaterial({ color: 0x1b3a66, metalness: 0.2, roughness: 0.5, emissive: 0x07101f, emissiveIntensity: 0.3 }));
  const accent = track(new THREE.MeshStandardMaterial({ color: 0x3de0ff, metalness: 0.4, roughness: 0.3, emissive: 0x0a2a34, emissiveIntensity: 0.5 }));

  const body = new THREE.Group();
  // torso
  const torsoGeo = track(new THREE.CapsuleGeometry(0.34, 0.7, 6, 12));
  const torso = new THREE.Mesh(torsoGeo, skin); torso.position.y = 1.45; body.add(torso);
  // head
  const headGeo = track(new THREE.SphereGeometry(0.24, 18, 16));
  const head = new THREE.Mesh(headGeo, skin); head.position.y = 2.15; body.add(head);
  // a cyan visor band (the one accent)
  const visorGeo = track(new THREE.TorusGeometry(0.24, 0.04, 8, 24));
  const visor = new THREE.Mesh(visorGeo, accent); visor.position.y = 2.15; visor.rotation.x = Math.PI / 2; body.add(visor);

  // limbs (capsules)
  const armGeo = track(new THREE.CapsuleGeometry(0.1, 0.7, 5, 10));
  const legGeo = track(new THREE.CapsuleGeometry(0.13, 0.85, 5, 10));
  const lArm = new THREE.Mesh(armGeo, skin); lArm.position.set(-0.46, 1.4, 0); lArm.rotation.z = 0.18; body.add(lArm);
  const rArm = new THREE.Mesh(armGeo, skin); rArm.position.set(0.46, 1.4, 0); rArm.rotation.z = -0.18; body.add(rArm);
  const lLeg = new THREE.Mesh(legGeo, skin); lLeg.position.set(-0.18, 0.5, 0); body.add(lLeg);
  const rLeg = new THREE.Mesh(legGeo, skin); rLeg.position.set(0.18, 0.5, 0); body.add(rLeg);

  // a soft ground halo
  const haloGeo = track(new THREE.RingGeometry(0.6, 1.1, 32));
  const haloMat = track(new THREE.MeshBasicMaterial({ color: 0x3de0ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
  const halo = new THREE.Mesh(haloGeo, haloMat); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; body.add(halo);

  group.add(body);
  group.userData.replaceable = true;     // marks the procedural placeholder

  function update(time, dt, cp, near) {
    // gentle idle: breathing + weight shift + subtle turn toward the camera
    const breathe = Math.sin(time * 1.6) * 0.02;
    torso.scale.set(1 + breathe, 1 - breathe * 0.5, 1 + breathe);
    head.position.y = 2.15 + breathe * 0.5;
    body.position.y = Math.sin(time * 0.8) * 0.03;
    body.rotation.y = Math.sin(time * 0.5) * 0.12;
    visor.material.emissiveIntensity = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(time * 2.2));
    halo.material.opacity = 0.1 + 0.12 * near;
    group.scale.setScalar(lerp(0.9, 1, near));
  }
  return { group, update };
}

/* ===========================================================================
   FX LAYER — the journey's air (zero assets, pure GLSL/geometry).
   • Rail dust: ONE Points cloud spanning the whole camera rail, one draw call.
     Scroll-velocity reactive: motes swell + brighten in transit, settle at
     every dwell — travel FEELS like travel.
   • Light shafts: fake-volumetric open cones (vUv beam falloff + organic
     flicker) — two ceiling lights down the hall, one warm concert spotlight
     over the figure.
   • Stage rings: breathing emissive rings under the object and the figure.
   All of it answers reduced-motion with a composed still (uVel stays 0, time
   is frozen by the renderOnce path) and the mobile tier cuts particle counts.
   =========================================================================== */
function buildFXLayer(track, anchors, scene) {
  const fxGroup = new THREE.Group();
  const mobile = BOOT.isMobile();

  // ── rail dust ────────────────────────────────────────────────────────────
  const COUNT = mobile ? 280 : 950;
  const zNear = 8, zFar = anchors[anchors.length - 1].z - 14;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = Math.random() * 7 - 1.2;
    pos[i * 3 + 2] = zNear + (zFar - zNear) * Math.random();
    seed[i] = Math.random() * Math.PI * 2;
  }
  const dustGeo = track(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustMat = track(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uVel: { value: 0 }, uPixelRatio: { value: BOOT.pixelRatio() } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime, uVel, uPixelRatio;
      varying float vTwinkle;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.35 + aSeed) * 0.45;
        p.y += sin(uTime * 0.28 + aSeed * 1.7) * 0.35;
        vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 3.1);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // perspective-scaled with a hard cap: a mote drifting right past the
        // lens must read as a spark, never a screen-filling bokeh blob.
        gl_PointSize = min((1.6 + 1.1 * vTwinkle) * uPixelRatio * (1.0 + uVel * 2.2) * (110.0 / max(1.0, -mv.z)), 26.0 * uPixelRatio);
      }`,
    fragmentShader: `
      uniform float uVel;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float disc = smoothstep(0.5, 0.08, d);
        vec3 tint = mix(vec3(0.55, 0.78, 0.85), vec3(0.24, 0.88, 1.0), vTwinkle);
        gl_FragColor = vec4(tint, disc * vTwinkle * (0.26 + uVel * 0.8));
      }`,
  }));
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  fxGroup.add(dust);

  // ── fake-volumetric light shaft (open cone, beam falloff + flicker) ─────
  const shaftMats = [];
  function addShaft(apex, height, radius, color, intensity) {
    const geo = track(new THREE.ConeGeometry(radius, height, 24, 1, true));
    const mat = track(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } },
      vertexShader: `
        varying vec2 vUv;
        varying float vFres;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * normal);
          vFres = abs(dot(normalize(-mv.xyz), n));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uTime, uIntensity;
        uniform vec3 uColor;
        varying vec2 vUv;
        varying float vFres;
        void main() {
          float beam = pow(vUv.y, 1.6);                                   // bright at apex, fades down
          float flicker = 0.86 + 0.14 * sin(uTime * 1.7 + vUv.x * 6.28);  // organic, never strobing
          float a = beam * flicker * vFres * uIntensity;
          gl_FragColor = vec4(uColor, a);
        }`,
    }));
    const cone = new THREE.Mesh(geo, mat);
    cone.position.set(apex.x, apex.y - height / 2, apex.z);   // geometry apex sits at `apex`
    fxGroup.add(cone);
    shaftMats.push(mat);
  }
  // two cool ceiling lights raking the hall, one warm spotlight on the figure
  addShaft(new THREE.Vector3(anchors[1].x, 4.6, anchors[1].z - 2), 6.2, 2.2, 0x3de0ff, 0.30);
  if (!mobile) addShaft(new THREE.Vector3(anchors[1].x, 4.6, anchors[1].z - 8), 6.2, 2.2, 0x3de0ff, 0.24);
  addShaft(new THREE.Vector3(anchors[3].x, 4.4, anchors[3].z - 3.5), 5.6, 1.9, 0xffb270, 0.42);

  // ── breathing stage rings (object cyan · figure ember) ──────────────────
  const rings = [];
  function addRing(center, r, color) {
    const geo = track(new THREE.RingGeometry(r, r * 1.08, 64));
    const mat = track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(center);
    fxGroup.add(ring);
    rings.push(ring);
  }
  addRing(new THREE.Vector3(anchors[0].x, -0.98, anchors[0].z - 1.5), 1.35, 0x3de0ff);
  addRing(new THREE.Vector3(anchors[3].x, -0.98, anchors[3].z - 3.5), 1.1, 0xffb270);

  scene.add(fxGroup);

  let velSmoothed = 0;
  function update(time, dt, vel) {
    velSmoothed += (vel - velSmoothed) * (1 - Math.exp(-3.6 * Math.max(dt, 1e-4)));
    dustMat.uniforms.uTime.value = time;
    dustMat.uniforms.uVel.value = velSmoothed;
    shaftMats.forEach((m) => { m.uniforms.uTime.value = time; });
    rings.forEach((ring, i) => {
      const pulse = 1 + Math.sin(time * (1.2 + i * 0.25)) * 0.03;
      ring.scale.setScalar(pulse);
      ring.material.opacity = 0.45 + 0.2 * (0.5 + 0.5 * Math.sin(time * (1.2 + i * 0.25)));
    });
  }
  return { group: fxGroup, update, get velocity() { return velSmoothed; } };
}

/* ---------------------------------------------------------------------------
   ENV MAP — a tiny procedural cube so PBR metal has reflections (no asset).
   --------------------------------------------------------------------------- */
function buildEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  // gradient sky from a large inverted sphere
  const geo = new THREE.SphereGeometry(10, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true });
  const colors = [];
  const pos = geo.attributes.position;
  const top = new THREE.Color(0x1b3a66), bottom = new THREE.Color(0x05060b), glow = new THREE.Color(0x3de0ff);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    c.copy(bottom).lerp(top, clamp(y * 0.5 + 0.5, 0, 1));
    if (pos.getX(i) < -6) c.lerp(glow, 0.4);   // a cyan light source on one side
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geo, mat));
  const tex = pmrem.fromScene(scene).texture;
  geo.dispose(); mat.dispose(); pmrem.dispose();
  return tex;
}

/* ---------------------------------------------------------------------------
   MANIFEST UPGRADE — swap a procedural placeholder for a real .glb when the
   manifest points at one that loads clean. runtime:"procedural" → stay
   procedural. This is the "data, not code" swap: no per-chapter branches in the
   build above. The only source of runtime asset paths is the manifest.
   --------------------------------------------------------------------------- */
/* Pose-aware bounding box. `Box3.setFromObject` measures a SKINNED mesh from
   its bind-pose geometry — for rigged exports (Mixamo) that box is a fraction
   of a unit and lies about the real size. `computeBoundingBox()` on a
   SkinnedMesh re-derives it from the POSED vertices, already in the root's
   frame (do NOT re-multiply by matrixWorld — that double-counts the scale). */
function measurePosedBox(root) {
  const box = new THREE.Box3();
  let sawSkinned = false;
  root.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) {
      sawSkinned = true;
      o.computeBoundingBox();
      if (o.boundingBox) box.union(o.boundingBox);
    }
  });
  if (!sawSkinned) box.setFromObject(root);
  return box;
}

/* Normalize an arbitrary generated/third-party model: stand `height` units
   tall, centered on X/Z, base resting at local y = 0. Makes the manifest's
   numbers creative choices instead of unit-conversion guesses. */
function normalizeToHeight(root, height) {
  root.updateWorldMatrix(true, true);
  const box = measurePosedBox(root);
  if (box.isEmpty()) return;
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 1e-6) root.scale.multiplyScalar(height / size.y);
  root.updateWorldMatrix(true, true);
  const scaled = measurePosedBox(root);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaled.min.y;
}

async function upgradeFromManifest(manifest, groups, track, scene, mixers) {
  if (!manifest || !manifest.chapters) return;
  const idToGroup = { object: groups[0], world: groups[1], field: groups[2], figure: groups[3] };
  const base = manifest.basePath || 'assets-3d/';

  const entries = Object.entries(manifest.chapters);
  for (const [id, cfg] of entries) {
    // "procedural" (or missing) → keep the procedural placeholder. Only a real
    // runtime path is loaded; a path that 404s falls back silently (catch below).
    // From file:// the fetch fails too — the page never breaks, it just stays
    // on the designed placeholders.
    if (!cfg || !cfg.runtime || cfg.runtime === 'procedural') continue;
    const target = idToGroup[id];
    if (!target) continue;
    try {
      // lazy-import the loaders ONLY when a real model exists (keeps the
      // zero-asset path free of GLTF/Draco network calls)
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      // THIRD-PARTY NETWORK CALL: the Draco decoder (wasm/js) is fetched from the
      // unpkg.com CDN at runtime, only on this Draco-compressed-model path. If your
      // deployment policy forbids third-party CDNs, self-host the decoder and point
      // setDecoderPath() at your own origin. Disclosed in manifest.json → security.
      draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
      loader.setDRACOLoader(draco);
      const gltf = await loader.loadAsync(base + cfg.runtime);

      // wrap in a holder so normalize/choreography never fight the file's own
      // root transform; the holder is what the engine positions + animates.
      const real = gltf.scene;
      normalizeToHeight(real, cfg.height || 2);
      const holder = new THREE.Group();
      holder.add(real);

      const anchor = target.group.position.clone();
      if (id === 'object') {
        // hero artifact: centered at the anchor, levitating (base→center shift)
        real.position.y -= (cfg.height || 2) / 2;
        holder.position.copy(anchor).setY(anchor.y + (cfg.lift ?? 0.4));
      } else {
        // world / figure: base on the floor plane the placeholders implied
        holder.position.set(anchor.x, -1, anchor.z + (id === 'figure' ? -3.5 : 0));
      }

      // animation: play whatever clips the file carries; strip root motion so
      // a Mixamo dance stays planted on its mark instead of drifting offstage.
      let mixer = null;
      if (gltf.animations && gltf.animations.length) {
        const clips = gltf.animations.map((clip) => {
          if (cfg.stripRootMotion) clip.tracks = clip.tracks.filter((tr) => !/hips\.position$/i.test(tr.name));
          return clip;
        });
        mixer = new THREE.AnimationMixer(real);
        const action = mixer.clipAction(clips[0]);
        action.play();
        if (reduce) { mixer.update(1.2); }          // reduced motion: one held pose
        else mixers.push(mixer);
      }

      // swap: dispose placeholder, install the real model + a new update fn
      target.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      scene.remove(target.group);
      scene.add(holder);
      target.group = holder;
      const baseY = holder.position.y;
      const spin = cfg.spin || 0;
      target.update = (time, dt, cp, near) => {
        if (spin) holder.rotation.y += dt * spin;
        if (id === 'object') holder.position.y = baseY + Math.sin(time * 1.1) * 0.07; // levitate
        if (id === 'figure') holder.rotation.y = Math.sin(time * 0.4) * 0.25;         // face the room
      };
      draco.dispose();
      console.info(`[flagship] chapter "${id}" upgraded → ${cfg.runtime}`);
    } catch (e) {
      // 404 / decode error / file:// → keep the procedural placeholder, no visible break
      console.info(`[flagship] chapter "${id}" stays procedural (${e.message})`);
    }
  }
}

/* ---------------------------------------------------------------------------
   XR + AR — feature-detect FIRST, then mount affordances. Never a dead button.
   • Immersive VR via three's VRButton (only if isSessionSupported('immersive-vr')
     AND not reduced-motion — forced immersive motion is unsafe under PRM).
   • AR quick-look via <model-viewer> per AR-flagged chapter, using the manifest's
     usdz/model when present; the native button hides itself if AR can't launch.
   --------------------------------------------------------------------------- */
async function mountXRAndAR(renderer, manifest) {
  let support = { vr: false, ar: false };
  try { support = await BOOT.xrSupport(); } catch (e) {}

  // ── Immersive VR — only when supported and motion is allowed ────────────
  if (support.vr && !reduce) {
    try {
      const { VRButton } = await import('three/addons/webxr/VRButton.js');
      const vrBtn = VRButton.createButton(renderer);  // self-gates; we already detected
      vrBtn.classList.add('btn');
      // place the Enter-VR button into chapters that opted in (world, figure)
      ['world', 'figure'].forEach((id) => {
        const host = document.querySelector(`.actions[data-actions="${id}"]`);
        if (host) { const clone = vrBtn.cloneNode(true); wireVR(clone, renderer); host.appendChild(clone); }
      });
    } catch (e) { console.info('[flagship] VR button unavailable:', e.message); }
  }

  // ── AR quick-look (phones) — model-viewer, per AR chapter ───────────────
  const chapters = (manifest && manifest.chapters) || {};
  const base = (manifest && manifest.basePath) || 'assets-3d/';
  ['object', 'figure'].forEach((id) => {
    const cfg = chapters[id] || {};
    const host = document.querySelector(`.actions[data-actions="${id}"]`);
    if (!host) return;
    // AR is offered only when the manifest carries a real asset: an iOS
    // quick-look (iosAr/.usdz) and/or a loadable runtime .glb for Scene Viewer.
    // Today both are "procedural"/null → no dead AR button. Drop a real iosAr
    // path in the manifest and this lights up with zero code change.
    const glb = cfg.runtime && cfg.runtime !== 'procedural' ? cfg.runtime : null;
    if (!cfg.iosAr && !glb) return;
    const wrap = document.createElement('div');
    wrap.className = 'mv-host';
    const mv = document.createElement('model-viewer');
    if (glb) mv.setAttribute('src', base + glb);
    if (cfg.iosAr) mv.setAttribute('ios-src', base + cfg.iosAr);
    mv.setAttribute('ar', '');
    mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    mv.setAttribute('ar-scale', 'fixed');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('environment-image', 'neutral');
    if (cfg.fallbackPoster) mv.setAttribute('poster', base + cfg.fallbackPoster);
    mv.setAttribute('reveal', 'auto');
    mv.setAttribute('alt', `${id} model, viewable in augmented reality`);
    const arBtn = document.createElement('button');
    arBtn.className = 'ar-cta'; arBtn.setAttribute('slot', 'ar-button');
    arBtn.textContent = 'View in your space';
    mv.appendChild(arBtn);
    wrap.appendChild(mv);
    host.appendChild(wrap);
    // hide the CTA if AR can't actually launch on this device
    mv.addEventListener('load', () => { if (!mv.canActivateAR) arBtn.setAttribute('hidden', ''); });
  });
}

function wireVR(btn, renderer) {
  // three's VRButton already wires click → session; on session start/end we
  // freeze/restore the scroll camera (comfort: no forced locomotion in XR).
  renderer.xr.addEventListener('sessionstart', () => { /* scroll camera frozen by isPresenting guard */ });
  renderer.xr.addEventListener('sessionend', () => { /* scroll camera resumes */ });
}
