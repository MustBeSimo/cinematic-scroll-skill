'use client';

/**
 * AURORA — flowing curtains of light high above the rail.
 *
 * Three tall ribbons with a domain-warped fbm alpha field, additively blended,
 * so they read as volumetric sheets of moving light rather than "planes with a
 * texture": the banding *flows* continuously (the same noise grammar as the
 * Field chapter), edges feather to nothing, and the fog tints them per chapter.
 * Desktop only — the mobile budget keeps the lean pipeline.
 */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uSeed: 0,
    uColorA: new THREE.Color('#1a4a6e'),
    uColorB: new THREE.Color('#3de0ff'),
    uIntensity: 0.5,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uSeed;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uIntensity;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                 mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }
    void main(){
      // Curtain bands that drift sideways and shimmer vertically.
      vec2 q = vec2(vUv.x * 2.6 + uSeed * 7.0 + uTime * 0.022,
                    vUv.y * 1.4 - uTime * 0.013);
      float n = fbm(q + fbm(q + uTime * 0.01));
      float band = smoothstep(0.34, 0.52, n) * smoothstep(0.95, 0.55, n);
      // Feather every edge — the ribbon must never read as a rectangle.
      float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
                 * smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
      vec3 col = mix(uColorA, uColorB, clamp(vUv.y + (n - 0.5) * 0.8, 0.0, 1.0));
      gl_FragColor = vec4(col, band * edge * uIntensity);
    }
  `,
);

type AuroraMaterialImpl = InstanceType<typeof AuroraMaterial> & {
  uTime: number;
  uSeed: number;
  uColorA: THREE.Color;
  uColorB: THREE.Color;
  uIntensity: number;
};

const RIBBONS: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number]; a: string; b: string; seed: number }[] = [
  { pos: [-6, 11, -18], rot: [0.35, 0.25, -0.08], size: [46, 12], a: '#123a5c', b: '#3de0ff', seed: 1.7 },
  { pos: [8, 13, -34], rot: [0.4, -0.3, 0.1], size: [52, 14], a: '#241546', b: '#9a6cff', seed: 4.2 },
  { pos: [0, 12, -50], rot: [0.32, 0.12, 0.05], size: [44, 11], a: '#3a1c10', b: '#ffb270', seed: 8.9 },
];

export function Aurora({ animate }: { animate: boolean }) {
  const materials = useMemo(
    () =>
      RIBBONS.map((r) => {
        const m = new AuroraMaterial() as AuroraMaterialImpl;
        m.transparent = true;
        m.depthWrite = false;
        m.blending = THREE.AdditiveBlending;
        m.side = THREE.DoubleSide;
        m.uSeed = r.seed;
        m.uColorA = new THREE.Color(r.a);
        m.uColorB = new THREE.Color(r.b);
        m.uIntensity = 0.5;
        return m;
      }),
    [],
  );

  useEffect(() => {
    return () => materials.forEach((m) => m.dispose());
  }, [materials]);

  useFrame((_, delta) => {
    if (!animate) return;
    for (const m of materials) m.uTime += delta;
  });

  return (
    <>
      {RIBBONS.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot} frustumCulled={false}>
          <planeGeometry args={r.size} />
          <primitive object={materials[i]} attach="material" />
        </mesh>
      ))}
    </>
  );
}
