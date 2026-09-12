// Meridian — scroll-driven 3D hero.
// Progressive enhancement only: the SVG poster is the real markup and is shown
// by default. This script may replace it with a <canvas> once a WebGL context,
// the GLTF model and one rendered frame have all succeeded. Any failure at any
// stage — missing WebGL, a broken vendor build, a missing model or environment
// map — must leave the poster exactly as it was, with nothing thrown uncaught.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  initScene().catch(() => {
    // Any rejection anywhere in setup: the poster stays. Nothing uncaught.
  });
}

async function initScene() {
  const stageFrame = document.getElementById('stageFrame');
  const poster = document.getElementById('poster');
  const scene = document.getElementById('scene');
  const chapterEls = Array.from(document.querySelectorAll('.chapter'));

  if (!stageFrame || !poster || !scene || chapterEls.length === 0) return;

  // Fail fast if a canvas can't even get a WebGL context.
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return;

  let THREE;
  let GLTFLoader;
  try {
    const [three, loaderModule] = await Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
    ]);
    THREE = three;
    GLTFLoader = loaderModule.GLTFLoader;
  } catch (err) {
    // Broken or missing vendor build: keep the poster.
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    return;
  }

  const three = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  // Three-point lighting. No HDR dependency — this is the primary illumination.
  const key = new THREE.DirectionalLight(0xfff2df, 3.2);
  key.position.set(2.2, 2.6, 3.2);
  const fill = new THREE.DirectionalLight(0xcfe0ee, 1.1);
  fill.position.set(-3, 0.6, 1.4);
  const rim = new THREE.DirectionalLight(0xffffff, 2.6);
  rim.position.set(-0.6, 2.4, -3.4);
  const ambient = new THREE.HemisphereLight(0xf3efe7, 0x201b15, 0.35);
  three.add(key, fill, rim, ambient);

  // Optional environment map: attempt it, but the scene above already renders
  // correctly without it, per the brief's studio.hdr note.
  try {
    const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
    const pmrem = new THREE.PMREMGenerator(renderer);
    const hdrTexture = await new RGBELoader().loadAsync('./kit/assets/studio.hdr');
    three.environment = pmrem.fromEquirectangular(hdrTexture).texture;
    hdrTexture.dispose();
    pmrem.dispose();
  } catch (err) {
    // Not delivered / not supported — the three-point lights already do the job.
  }

  let vessel;
  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('./kit/assets/vessel.glb');
    vessel = gltf.scene;
  } catch (err) {
    renderer.dispose();
    return;
  }

  // Normalise so camera keyframes are independent of the source model's scale.
  const box = new THREE.Box3().setFromObject(vessel);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const scale = size.y > 0 ? 1.6 / size.y : 1;
  vessel.scale.setScalar(scale);
  vessel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  const rig = new THREE.Group();
  rig.add(vessel);
  three.add(rig);

  // Camera keyframes, one per chapter: intro, Form, Glaze, Studio.
  const keyframes = [
    { pos: new THREE.Vector3(0, 0.15, 3.1), look: new THREE.Vector3(0, 0.05, 0), rot: 0 },
    { pos: new THREE.Vector3(1.3, 0.05, 1.9), look: new THREE.Vector3(0, 0, 0), rot: 0.6 },
    { pos: new THREE.Vector3(-0.9, 0.25, 1.1), look: new THREE.Vector3(0, 0.05, 0), rot: 2.1 },
    { pos: new THREE.Vector3(0, 0.4, 3.4), look: new THREE.Vector3(0, 0, 0), rot: 3.4 },
  ];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function chapterFloat() {
    const sceneRect = scene.getBoundingClientRect();
    const scrollRange = scene.offsetHeight - window.innerHeight;
    const current = Math.min(Math.max(-sceneRect.top, 0), Math.max(scrollRange, 1));

    for (let i = 0; i < chapterEls.length - 1; i++) {
      const a = chapterEls[i].offsetTop;
      const b = chapterEls[i + 1].offsetTop;
      if (current <= b || i === chapterEls.length - 2) {
        const t = b > a ? Math.min(Math.max((current - a) / (b - a), 0), 1) : 0;
        return i + easeInOutCubic(t);
      }
    }
    return 0;
  }

  const camTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let rotTarget = 0;
  const camCurrent = keyframes[0].pos.clone();
  const lookCurrent = keyframes[0].look.clone();
  let rotCurrent = 0;

  function updateTargets() {
    const f = chapterFloat();
    const i0 = Math.max(0, Math.min(keyframes.length - 1, Math.floor(f)));
    const i1 = Math.min(keyframes.length - 1, i0 + 1);
    const t = f - i0;
    camTarget.lerpVectors(keyframes[i0].pos, keyframes[i1].pos, t);
    lookTarget.lerpVectors(keyframes[i0].look, keyframes[i1].look, t);
    rotTarget = keyframes[i0].rot + (keyframes[i1].rot - keyframes[i0].rot) * t;
  }

  let visible = false;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) requestTick();
  }, { threshold: 0.01 });
  io.observe(stageFrame);

  let raf = null;
  let firstFrameShown = false;
  let disposed = false;

  function sizeRenderer() {
    const rect = stageFrame.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render() {
    camCurrent.lerp(camTarget, 0.08);
    lookCurrent.lerp(lookTarget, 0.08);
    rotCurrent += (rotTarget - rotCurrent) * 0.08;

    camera.position.copy(camCurrent);
    camera.lookAt(lookCurrent);
    rig.rotation.y = rotCurrent;

    renderer.render(three, camera);

    if (!firstFrameShown) {
      firstFrameShown = true;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      stageFrame.appendChild(renderer.domElement);
      poster.classList.add('is-hidden');
    }
  }

  function settled() {
    return (
      camCurrent.distanceTo(camTarget) < 0.0015 &&
      lookCurrent.distanceTo(lookTarget) < 0.0015 &&
      Math.abs(rotTarget - rotCurrent) < 0.0015
    );
  }

  function tick() {
    raf = null;
    if (disposed) return;
    if (!visible) return;
    updateTargets();
    render();
    if (!settled()) requestTick();
  }

  function requestTick() {
    if (raf === null && !disposed) raf = requestAnimationFrame(tick);
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeRenderer();
      requestTick();
    }, 100);
  }

  function onScroll() {
    requestTick();
  }

  sizeRenderer();
  updateTargets();
  render();
  requestTick();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf !== null) cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    three.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => {
            if (v && v.isTexture) v.dispose();
          });
          m.dispose();
        });
      }
    });
    renderer.dispose();
  }

  window.addEventListener('pagehide', dispose);
}
