'use client';

/**
 * RAIL DUST — the connective tissue of the whole journey.
 *
 * One GPU point cloud spanning the full camera rail (every chapter and every
 * transit between them), so the air is never empty: thousands of motes drift,
 * twinkle, and catch the chapter tints. The cloud is scroll-velocity reactive —
 * `ScrollCameraRig` publishes damped travel speed on `railVelocity`, and the
 * shader answers by swelling and brightening the motes mid-flight, so fast
 * travel *feels* fast (a warp cue) and a dwell feels still.
 *
 * One draw call, zero per-frame allocation: drift, twinkle and the velocity
 * response all live in the vertex shader (`3d-stack.md` §3/§5).
 */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

import { railVelocity } from '@/lib/flagship-velocity';

const DustMaterial = shaderMaterial(
  { uTime: 0, uVel: 0, uPixelRatio: 1 },
  // vertex — per-mote drift + twinkle + velocity swell
  /* glsl */ `
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uVel;
    uniform float uPixelRatio;
    varying float vTwinkle;
    varying float vFade;
    void main(){
      vec3 p = position;
      float t = uTime * (0.04 + aSeed * 0.05);
      p.x += sin(t * 6.2832 + aSeed * 40.0) * 0.6;
      p.y += sin(t * 4.71   + aSeed * 80.0) * 0.4;
      p.z += cos(t * 5.5    + aSeed * 60.0) * 0.5;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 100.0);
      // Fade both extremes: far motes sink into the fog, near motes don't
      // smear across the lens. (Reversed-edge smoothstep == 1 - smoothstep.)
      vFade = smoothstep(-60.0, -5.0, mv.z) * (1.0 - smoothstep(-3.5, -1.2, mv.z));
      float size = aSize * uPixelRatio * (1.0 + uVel * 2.5) * (180.0 / -mv.z);
      gl_PointSize = min(size, 9.0 * uPixelRatio);
      gl_Position = projectionMatrix * mv;
    }
  `,
  // fragment — soft disc, steel→cyan with the twinkle, brighter under travel
  /* glsl */ `
    uniform float uVel;
    varying float vTwinkle;
    varying float vFade;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float disc = smoothstep(0.5, 0.08, d);
      vec3 col = mix(vec3(0.55, 0.70, 0.92), vec3(0.38, 0.93, 1.0), vTwinkle);
      float a = disc * vTwinkle * (0.30 + uVel * 0.85) * vFade;
      gl_FragColor = vec4(col, a);
    }
  `,
);

type DustMaterialImpl = InstanceType<typeof DustMaterial> & {
  uTime: number;
  uVel: number;
  uPixelRatio: number;
};

export type RailDustProps = {
  /** Reduced motion → a still, dim field (no drift, no velocity response). */
  animate: boolean;
  /** Mote count — the mobile path passes a third of the desktop budget. */
  count: number;
};

export function RailDust({ animate, count }: RailDustProps) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = Math.random() * 6.5;
      pos[i * 3 + 2] = 8 - Math.random() * 66; // spans the whole rail
      seed[i] = Math.random();
      size[i] = 0.8 + Math.random() * 2.0;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return g;
  }, [count]);

  const material = useMemo(() => {
    const m = new DustMaterial() as DustMaterialImpl;
    m.transparent = true;
    m.depthWrite = false;
    m.blending = THREE.AdditiveBlending;
    return m;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ gl }, delta) => {
    material.uPixelRatio = gl.getPixelRatio();
    if (!animate) {
      material.uTime = 0;
      material.uVel = 0;
      return;
    }
    material.uTime += delta;
    material.uVel = railVelocity.current;
  });

  return <points geometry={geometry} frustumCulled={false}>
    <primitive object={material} attach="material" />
  </points>;
}
