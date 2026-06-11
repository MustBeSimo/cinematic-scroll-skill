'use client';

/**
 * FLAGSHIP — Mode B (React Three Fiber + WebXR).
 *
 * One Canvas, one renderer, one scene graph; the camera travels between four
 * chapters (OBJECT · WORLD · FIELD · FIGURE) as you scroll — the R3F twin of the
 * vanilla Mode-A flagship (`examples/flagship/`). "One choreography, two media."
 *
 * Engineering contract (`references/3d-stack.md` + `webxr.md`):
 *   • dpr={[1, 2]}  — pixelRatio clamp ≤ 2 (1.5 ceiling on mobile)
 *   • drei <ScrollControls>/useScroll drive a lerped scroll-camera rig
 *   • @react-three/xr v6: createXRStore + <XR store> + <XROrigin>; enter via
 *     store.enterVR()/enterAR(); scroll-camera FREEZES while presenting
 *   • <Environment> for image-based lighting (procedural preset — zero assets)
 *   • useGLTF with graceful fallback to procedural geometry (per chapter)
 *   • Suspense fallbacks; reduced-motion → one still frame; mobile → lighter
 *   • R3F auto-disposes GPU resources on unmount (frameloop pauses when hidden)
 */

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, Preload, Scroll, ScrollControls, Stars, useGLTF, useScroll } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useXR, XR, XROrigin } from '@react-three/xr';
import * as THREE from 'three';

import {
  assetManifest,
  flagshipChapters,
  FLAGSHIP_PAGES,
  type FlagshipChapterId,
} from '@/lib/flagship-manifest';
import { flagshipXRStore } from '@/lib/flagship-xr';
import { railVelocity } from '@/lib/flagship-velocity';
import { RailDust } from './fx/RailDust';
import { Aurora } from './fx/Aurora';
import { ObjectChapter } from './chapters/ObjectChapter';
import { WorldChapter } from './chapters/WorldChapter';
import { FieldChapter } from './chapters/FieldChapter';
import { FigureChapter } from './chapters/FigureChapter';
import { FlagshipOverlay } from './FlagshipOverlay';

// Start GLB network requests at module-eval time — before the Canvas or any
// chapter component mounts. This is the single biggest perceived-load win:
// by the time the WebGL context is ready the meshes are already in cache.
(function preloadModels() {
  const urls = Object.values(assetManifest)
    .map((e) => e.runtime)
    .filter((r) => r !== 'procedural');
  urls.forEach((url) => useGLTF.preload(url, '/draco/'));
})();

/** World-space anchor for each chapter — spaced along -Z; the camera dollies
 *  between them. Index matches `flagshipChapters` order. */
const CHAPTER_ANCHORS: Record<FlagshipChapterId, THREE.Vector3> = {
  object: new THREE.Vector3(0, 0, 0),
  world: new THREE.Vector3(0, 0, -16),
  field: new THREE.Vector3(0, 0, -32),
  figure: new THREE.Vector3(0, 0, -48),
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smootherstep — zero 1st AND 2nd derivative at the ends, so each chapter is
 *  a true dwell point: the camera settles, holds, then eases out. */
const smootherstep = (f: number) => f * f * f * (f * (f * 6 - 15) + 10);

/**
 * Remap linear scroll progress into dwell-and-travel pacing. Raw scroll maps
 * the camera linearly along the rail, which spends most of the scroll in
 * fast transit and makes chapters POP into view like hard cuts. This shapes
 * each anchor-to-anchor segment with smootherstep, so velocity hits zero at
 * every chapter (arrive → hold → depart — the skill's pacing grammar).
 */
function dwellEase(t: number): number {
  const segs = flagshipChapters.length - 1;
  const seg = THREE.MathUtils.clamp(t, 0, 1) * segs;
  const i = Math.min(Math.floor(seg), segs - 1);
  // Clamp: the smootherstep polynomial can overshoot 1.0 by a float ulp at the
  // rail's end, and CatmullRomCurve3.getPointAt(t > 1) indexes past its points
  // array — a hard crash on the final chapter.
  return Math.min((i + smootherstep(seg - i)) / segs, 1);
}

/**
 * Per-chapter GL atmosphere tints — the scene-side half of the skill's
 * signature environment morph (the overlay already morphs in CSS). Background
 * and fog glide between these as the camera travels, so each chapter has its
 * own air: steel (Object), abyssal navy (World), violet (Field), ember (Figure).
 */
const CHAPTER_TINTS: Record<FlagshipChapterId, THREE.Color> = {
  object: new THREE.Color('#0a1018'),
  world: new THREE.Color('#070d1d'),
  field: new THREE.Color('#150e28'),
  figure: new THREE.Color('#170f0a'),
};

/** Per-chapter fog DENSITY — each chapter gets its own air weight: clean
 *  around the hero object, thick in the hall, near-vacuum for the field's
 *  far-plane shader, smoky for the dancer. */
const CHAPTER_FOG: Record<FlagshipChapterId, number> = {
  object: 0.012,
  world: 0.022,
  field: 0.008,
  figure: 0.018,
};

/** Lerps scene background + fog color/density toward the active chapter's air. */
function AtmosphereMorph({ animate }: { animate: boolean }) {
  const scroll = useScroll();
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame(({ scene }) => {
    const segs = flagshipChapters.length - 1;
    const t = animate ? scroll.offset : 0;
    const seg = THREE.MathUtils.clamp(t, 0, 1) * segs;
    const i = Math.min(Math.floor(seg), segs - 1);
    const k = smootherstep(seg - i);
    const from = CHAPTER_TINTS[flagshipChapters[i].id];
    const to = CHAPTER_TINTS[flagshipChapters[i + 1].id];
    scratch.copy(from).lerp(to, k);
    if (scene.background instanceof THREE.Color) scene.background.lerp(scratch, 0.08);
    if (scene.fog) {
      scene.fog.color.lerp(scratch, 0.08);
      const fog = scene.fog as THREE.FogExp2;
      if ('density' in fog) {
        const target = lerp(
          CHAPTER_FOG[flagshipChapters[i].id],
          CHAPTER_FOG[flagshipChapters[i + 1].id],
          k,
        );
        fog.density = lerp(fog.density, target, 0.06);
      }
    }
  });

  return null;
}

export type FlagshipSceneProps = {
  /** When false (reduced motion / static), the scene holds one composed frame. */
  animate: boolean;
  /** Lower-cost path for narrow/coarse-pointer devices. */
  mobile: boolean;
};

export function FlagshipScene({ animate, mobile }: FlagshipSceneProps) {
  // Mobile: tighter DPR ceiling (`3d-stack.md` §3/§4). Desktop: clamp ≤ 2.
  const dpr = useMemo<[number, number]>(() => (mobile ? [1, 1.5] : [1, 2]), [mobile]);

  return (
    <Canvas
      dpr={dpr}
      shadows={!mobile}
      gl={{
        antialias: !mobile,
        powerPreference: mobile ? 'default' : 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [0, 1.6, 6], fov: 45, near: 0.1, far: 200 }}
      // R3F pauses useFrame automatically when the canvas is not visible. Under
      // reduced motion (`animate=false`) each chapter's useFrame holds a fixed,
      // motionless pose — a still frame, not a blank canvas (`3d-stack.md` §4).
      frameloop="always"
    >
      <XR store={flagshipXRStore}>
        <XROrigin position={[0, 0, 6]} />
        <color attach="background" args={['#05060b']} />
        <fogExp2 attach="fog" args={['#05060b', mobile ? 0.018 : 0.014]} />

        {/* Image-based lighting — a procedural Lightformer studio instead of an
            HDR preset: the "city" preset silently fetches potsdamer_platz_1k.hdr
            from a third-party CDN at runtime and CRASHES the scene when it's
            unreachable (offline, intranet, blocked CDN). Three rect formers in
            the art direction's palette give the glass core / brushed metal its
            speculars with zero network dependency. */}
        <Environment resolution={128} frames={1}>
          {/* cool overhead strip — the main broad specular */}
          <Lightformer form="rect" intensity={2.4} color="#cfe8ee" position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[14, 6, 1]} />
          {/* cyan side fill — picks out chapter-accent rims */}
          <Lightformer form="rect" intensity={1.1} color="#3de0ff" position={[-7, 1.5, -2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} />
          {/* warm ember kicker opposite — the figure chapter's air */}
          <Lightformer form="rect" intensity={0.8} color="#ffb270" position={[7, 1, -6]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 2.5, 1]} />
        </Environment>

        {/* Key + rim lights (stable, level — no roll, `webxr.md` §5). */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 8, 6]}
          intensity={mobile ? 1.0 : 1.4}
          castShadow={!mobile}
          shadow-mapSize={mobile ? 512 : 1024}
        />
        <pointLight position={[-6, 3, -20]} intensity={30} color="#3de0ff" distance={40} />

        {/* Deep-space backdrop — gives every chapter parallax depth for free.
            `speed` 0 under reduced motion (a still sky, not a dead one). */}
        <Stars
          radius={90}
          depth={50}
          count={mobile ? 1200 : 3000}
          factor={3.5}
          saturation={0}
          fade
          speed={animate ? 0.5 : 0}
        />

        {/* Atmospheric connective tissue — one dust field spans the whole rail
            (velocity-reactive: travel makes it swell and stream), and aurora
            curtains flow high above it. Desktop gets the full count; mobile a
            third; aurora is desktop-only (performance-budget §2). */}
        <RailDust animate={animate} count={mobile ? 550 : 1700} />
        {!mobile ? <Aurora animate={animate} /> : null}

        <ScrollControls pages={FLAGSHIP_PAGES} damping={0.3}>
          <ScrollCameraRig animate={animate} mobile={mobile} />
          <AtmosphereMorph animate={animate} />
          <ChapterRig animate={animate} mobile={mobile} />
          {/* HTML rail — portaled into the same scroll container so the copy and
              the GL camera advance in lockstep ("one choreography, two media"). */}
          <Scroll html style={{ width: '100%' }}>
            <FlagshipOverlay reducedMotion={!animate} />
          </Scroll>
        </ScrollControls>

        {/* Cinematic finish — desktop only (mobile keeps the lean pipeline,
            performance-budget §2) and never while an XR session presents. */}
        {!mobile ? <PostFX /> : null}

        <Preload all />
      </XR>
    </Canvas>
  );
}

/**
 * Bloom + vignette finishing pass. The bloom threshold sits above tone-mapped
 * white, so only HDR emissives (`toneMapped={false}` strips, visor, glow ring)
 * and the field's filaments bloom — body copy and surfaces stay crisp. Skipped
 * while presenting: the composer fights the XR framebuffer (`webxr.md` §5).
 */
function PostFX() {
  const presenting = useXR((s) => s.session != null);
  if (presenting) return null;
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.9} luminanceSmoothing={0.3} />
      {/* Lens fringe + film grain — both barely-there by design: at these
          values they read as "shot on glass", not as an Instagram filter. */}
      <ChromaticAberration offset={[0.0006, 0.001]} />
      <Noise premultiply opacity={0.07} />
      <Vignette offset={0.25} darkness={0.62} />
    </EffectComposer>
  );
}

/**
 * Scroll-camera rig (`3d-stack.md` §5). Maps `useScroll().offset` (0→1) to a
 * lerped position along a CatmullRom path through the chapter anchors. FREEZES
 * while an XR session is presenting — in a headset the user's head is the
 * camera; driving it from scroll induces nausea (`webxr.md` §5).
 */
function ScrollCameraRig({ animate, mobile }: { animate: boolean; mobile: boolean }) {
  const scroll = useScroll();
  const current = useRef(0);
  const parallax = useRef({ x: 0, y: 0 });
  const presenting = useXR((s) => s.session != null);

  const path = useMemo(() => {
    const anchors = flagshipChapters.map((c) => {
      const a = CHAPTER_ANCHORS[c.id];
      return new THREE.Vector3(a.x, 1.6, a.z + 6); // eye height, a step back
    });
    return new THREE.CatmullRomCurve3(anchors, false, 'catmullrom', 0.5);
  }, []);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, pointer, clock }, delta) => {
    if (presenting) return; // XR owns the camera — do not drive it.

    const target = animate ? scroll.offset : 0.5 / FLAGSHIP_PAGES; // still: frame ch.1
    const prev = current.current;
    // Time-based damping (~0.21s time constant), NOT a per-frame factor: a
    // per-frame lerp makes transit speed scale with refresh rate (2x faster on
    // 120 Hz, half-speed at 30 fps) and never converges under heavy load.
    current.current = lerp(current.current, target, animate ? 1 - Math.exp(-4.8 * delta) : 1);
    // Dwell-and-travel: settle at each chapter, ease through the transit.
    const t = dwellEase(current.current);

    // Publish damped travel speed (0 at a dwell, →1 in fast transit) for the
    // FX layer: rail dust swells, the FOV kicks, travel FEELS like travel.
    const rawVel = THREE.MathUtils.clamp(
      (Math.abs(current.current - prev) / Math.max(delta, 1e-4)) * 14,
      0,
      1,
    );
    railVelocity.current = lerp(railVelocity.current, animate ? rawVel : 0, 1 - Math.exp(-3.6 * delta));

    path.getPointAt(t, camPos);
    camera.position.copy(camPos);

    // Hand-held breathing — a barely-there idle drift so a dwell is alive,
    // never frozen. Two incommensurate sines: no visible loop.
    if (animate) {
      const bt = clock.elapsedTime;
      camera.position.y += Math.sin(bt * 0.55) * 0.035;
      camera.position.x += Math.sin(bt * 0.37 + 1.7) * 0.025;
    }

    // Pointer parallax (desktop only) — a heavily damped hand-held drift that
    // lets the viewer peek around the chapter. lookAt() below re-aims at the
    // anchor, so the subject stays framed; only the viewpoint slides.
    if (!mobile && animate) {
      const pk = 1 - Math.exp(-2.4 * delta);
      parallax.current.x = lerp(parallax.current.x, pointer.x, pk);
      parallax.current.y = lerp(parallax.current.y, pointer.y, pk);
      camera.position.x += parallax.current.x * 0.35;
      camera.position.y += parallax.current.y * 0.18;
    }

    // Look slightly ahead down the rail (toward the chapter the camera nears).
    const ahead = THREE.MathUtils.clamp(t + 0.04, 0, 1);
    path.getPointAt(ahead, lookTarget);
    lookTarget.y = 1.2; // stable, level horizon — no roll
    lookTarget.z -= 6; // look into the chapter, not at the rail point itself
    camera.lookAt(lookTarget);

    // Travel FOV kick — the lens widens a touch at speed (dolly-zoom energy)
    // and settles back to 45° at every dwell.
    const cam = camera as THREE.PerspectiveCamera;
    const fovTarget = 45 + railVelocity.current * 7;
    if (Math.abs(cam.fov - fovTarget) > 0.01) {
      cam.fov = lerp(cam.fov, fovTarget, 1 - Math.exp(-4.8 * delta));
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * Presence gate — stages a chapter's entrance. Without it all four chapters
 * are visible at once (fog alone can't hide the nearer ones) and the scene
 * reads as overlapping clutter from frame one. Each chapter scales up from
 * its own anchor and rises into place as the camera nears, holds at full
 * presence while the camera dwells, and recedes as it departs.
 */
function ChapterGate({
  index,
  anchor,
  animate,
  children,
}: {
  index: number;
  anchor: THREE.Vector3;
  animate: boolean;
  children: React.ReactNode;
}) {
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null);
  // Damped presence — chapter 1 opens already on stage.
  const presence = useRef(index === 0 ? 1 : 0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const segs = flagshipChapters.length - 1;
    const offset = animate ? scroll.offset : 0; // reduced motion: hold ch. 1
    const seg = dwellEase(THREE.MathUtils.clamp(offset, 0, 1)) * segs;
    const d = Math.abs(seg - index);
    // LATE entrance: nothing until the camera is most of the way there
    // (d < 0.5), full presence as it settles (d < 0.15). Mid-transit the rail
    // is empty — the next chapter materializes on arrival, not during travel.
    const target = smootherstep(THREE.MathUtils.clamp((0.5 - d) / 0.35, 0, 1));
    // Time-damped approach (~0.4s settle) — frame-rate independent, so an
    // entrance can never pop, even under a fast scroll flick.
    const k = animate ? 1 - Math.exp(-delta * 2.4) : 1;
    presence.current += (target - presence.current) * k;
    const s = presence.current;
    g.visible = s > 0.002;
    g.scale.setScalar(Math.max(s, 1e-4));
    // Scale around the chapter's OWN anchor (not the world origin): it grows
    // up from its floor point. No vertical sink — a partially-risen body
    // half-clipped through the floor reads as a glitch, not an entrance.
    g.position.copy(anchor).multiplyScalar(1 - s);
  });

  return <group ref={group}>{children}</group>;
}

/**
 * Mounts the four chapters and feeds each a per-chapter scroll progress ref
 * (0→1 within its own band), updated imperatively each frame so chapters don't
 * re-render on scroll.
 */
function ChapterRig({ animate, mobile }: { animate: boolean; mobile: boolean }) {
  const scroll = useScroll();

  // One progress ref per chapter — written in useFrame, read by each chapter.
  const progressRefs = useRef<Record<FlagshipChapterId, { current: number }>>({
    object: { current: 0 },
    world: { current: 0 },
    field: { current: 0 },
    figure: { current: 0 },
  });

  useFrame(() => {
    const n = flagshipChapters.length;
    flagshipChapters.forEach((c, i) => {
      // Each chapter owns a 1/N band of the scroll (N = chapters, NOT pages —
      // each chapter spans PAGES_PER_CHAPTER pages); map global offset → 0→1.
      progressRefs.current[c.id].current = scroll.range(i / n, 1 / n);
    });
  });

  const a = assetManifest;
  return (
    <>
      <ChapterGate index={0} anchor={CHAPTER_ANCHORS.object} animate={animate}>
        <ObjectChapter
          anchor={CHAPTER_ANCHORS.object}
          progress={progressRefs.current.object}
          animate={animate}
          modelUrl={a.object.runtime === 'procedural' ? null : a.object.runtime}
          scale={a.object.scale}
          mobile={mobile}
        />
      </ChapterGate>
      <ChapterGate index={1} anchor={CHAPTER_ANCHORS.world} animate={animate}>
        <WorldChapter
          anchor={CHAPTER_ANCHORS.world}
          modelUrl={a.world.runtime === 'procedural' ? null : a.world.runtime}
          scale={a.world.scale}
          animate={animate}
          mobile={mobile}
        />
      </ChapterGate>
      <ChapterGate index={2} anchor={CHAPTER_ANCHORS.field} animate={animate}>
        <FieldChapter anchor={CHAPTER_ANCHORS.field} progress={progressRefs.current.field} animate={animate} />
      </ChapterGate>
      <ChapterGate index={3} anchor={CHAPTER_ANCHORS.figure} animate={animate}>
        <FigureChapter
          anchor={CHAPTER_ANCHORS.figure}
          animate={animate}
          modelUrl={a.figure.runtime === 'procedural' ? null : a.figure.runtime}
          scale={a.figure.scale}
          clips={a.figure.animations ?? []}
        />
      </ChapterGate>
      {/* Ground. Desktop: blurred mirror floor — the chapters, light strips and
          halo reflect softly in it (the single biggest "premium" cue in the
          scene). Mobile: a plain dark floor — grounded, but no reflection pass. */}
      {!mobile ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -24]} receiveShadow>
          <planeGeometry args={[44, 92]} />
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={512}
            mixBlur={1}
            mixStrength={6}
            roughness={0.85}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0a0e18"
            metalness={0.6}
            mirror={0.45}
          />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -24]}>
          <planeGeometry args={[44, 92]} />
          <meshStandardMaterial color="#070a12" metalness={0.5} roughness={0.5} />
        </mesh>
      )}
    </>
  );
}
