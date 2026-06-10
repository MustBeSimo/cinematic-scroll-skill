'use client';

/**
 * FIELD chapter — Tier C (`references/3d-stack.md`): the visual IS the math.
 *
 * A full custom GLSL `ShaderMaterial` (a domain-warped flow field on the GPU)
 * reacting to scroll progress. ZERO assets — the always-works hero chapter; it
 * degrades by lowering resolution (the Canvas `dpr` clamp), never by going
 * blank. The GLSL is the same field shader the vanilla Mode-A flagship runs
 * (`examples/flagship/main.js`) — one choreography, two media.
 *
 * The material is built with drei's `shaderMaterial` factory (which compiles the
 * GLSL into a `ShaderMaterial` subclass with typed uniform accessors) and
 * attached via `<primitive object={material} attach="material" />` — fully typed,
 * no `any`, and version-proof across R3F majors. Uniforms are driven imperatively
 * in `useFrame` to avoid per-frame React re-renders.
 */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** drei `shaderMaterial` — default uniforms, then vertex + fragment GLSL. */
const FieldMaterial = shaderMaterial(
  {
    uTime: 0,
    uScroll: 0,
    uNear: 1,
    uColorA: new THREE.Color(0x0e1a38),
    uColorB: new THREE.Color(0x3de0ff),
    uColorC: new THREE.Color(0x241546),
  },
  // vertex
  /* glsl */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment — domain-warped fbm flow field (verbatim from Mode-A flagship)
  /* glsl */ `
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
);

/**
 * The drei `shaderMaterial` factory returns a `ShaderMaterial` *subclass* whose
 * instances expose each uniform as a typed accessor. We render it via
 * `<primitive object={material} attach="material" />` rather than a registered
 * JSX element — this keeps the typing fully version-proof (no `extend`/JSX
 * namespace augmentation that differs between R3F v8 and v9) and avoids `any`.
 */
type FieldMaterialImpl = InstanceType<typeof FieldMaterial> & {
  uTime: number;
  uScroll: number;
  uNear: number;
};

export type FieldChapterProps = {
  /** World-space anchor for this chapter (the camera rail passes through it). */
  anchor: THREE.Vector3;
  /**
   * 0→1 progress *within* this chapter (read each frame from the shared scroll).
   * A mutable holder so the parent updates it without re-rendering the chapter.
   */
  progress: { current: number };
  /** When false (reduced motion), the field renders one still frame, no anim. */
  animate: boolean;
};

export function FieldChapter({ anchor, progress, animate }: FieldChapterProps) {
  // Large quad facing +Z (toward a camera looking down -Z) — no per-frame
  // lookAt, so the loop allocates nothing (`3d-stack.md` §5).
  const geometry = useMemo(() => new THREE.PlaneGeometry(28, 18, 1, 1), []);
  const material = useMemo(() => {
    const m = new FieldMaterial() as FieldMaterialImpl;
    m.transparent = true;
    m.depthWrite = false;
    return m;
  }, []);

  // Dispose GPU resources on unmount — these were created imperatively, so R3F
  // does not auto-dispose them (`3d-stack.md` §3).
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const cp = THREE.MathUtils.clamp(progress.current, 0, 1);
    if (animate) {
      material.uTime = state.clock.elapsedTime;
      material.uScroll = lerp(material.uScroll, cp, 0.1);
    } else {
      // Reduced motion: hold one composed frame at this chapter's midpoint.
      material.uTime = 0;
      material.uScroll = 0.5;
    }
    // Fade the field with proximity to the chapter anchor — a wide window so
    // it breathes in/out over the dwell instead of snapping (pacing grammar).
    material.uNear = THREE.MathUtils.clamp(1 - Math.abs(cp - 0.5) * 1.1, 0, 1);
  });

  return (
    <group position={anchor}>
      <mesh geometry={geometry} position={[0, 1.2, 2]}>
        <primitive object={material} attach="material" />
      </mesh>
      {/* Drifting motes give the flat field plane real depth as the camera
          passes through. Motion → gated off under reduced motion. */}
      {animate ? (
        <Sparkles
          count={110}
          scale={[22, 11, 6]}
          position={[0, 1.2, 3.5]}
          size={2.4}
          speed={0.35}
          color="#7fe9ff"
          opacity={0.55}
        />
      ) : null}
    </group>
  );
}
