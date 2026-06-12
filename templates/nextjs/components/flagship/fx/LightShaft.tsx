'use client';

/**
 * LIGHT SHAFT — a fake-volumetric beam cone.
 *
 * An open cone, additively blended, whose alpha falls away from the source
 * (the apex), fades at grazing angles (a cheap fresnel stands in for real
 * volumetric scattering), and breathes with a slow organic flicker. The
 * concert-lighting move: it sells "light has a body in this air" for the cost
 * of one open cone — no raymarching, no render targets (`3d-stack.md` §3).
 */

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ShaftMaterial = shaderMaterial(
  { uTime: 0, uSeed: 0, uColor: new THREE.Color('#3de0ff'), uIntensity: 0.5 },
  /* glsl */ `
    varying vec2 vUv;
    varying float vFres;
    void main(){
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      // |view · normal| → 1 facing the camera, 0 edge-on: fade the silhouette
      // rim so the cone has no hard outline.
      vFres = abs(dot(normalize(-mv.xyz), n));
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    varying float vFres;
    uniform float uTime;
    uniform float uSeed;
    uniform vec3 uColor;
    uniform float uIntensity;
    void main(){
      // ConeGeometry: uv.v = 1 at the apex (the source), 0 at the open base.
      float beam = pow(vUv.y, 1.5);
      float flicker = 0.78 + 0.22 * sin(uTime * 1.7 + uSeed * 20.0)
                            * sin(uTime * 0.83 + uSeed * 7.0);
      float a = beam * vFres * flicker * uIntensity;
      gl_FragColor = vec4(uColor, a);
    }
  `,
);

type ShaftMaterialImpl = InstanceType<typeof ShaftMaterial> & {
  uTime: number;
  uSeed: number;
  uColor: THREE.Color;
  uIntensity: number;
};

export type LightShaftProps = {
  /** Apex (light source) position; the cone hangs straight down from here. */
  position: [number, number, number];
  /** Beam length (apex → floor). */
  height?: number;
  /** Radius of the pool at the floor. */
  radius?: number;
  color?: string;
  intensity?: number;
  animate: boolean;
};

export function LightShaft({
  position,
  height = 6,
  radius = 1.6,
  color = '#3de0ff',
  intensity = 0.5,
  animate,
}: LightShaftProps) {
  const material = useMemo(() => {
    const m = new ShaftMaterial() as ShaftMaterialImpl;
    m.transparent = true;
    m.depthWrite = false;
    m.blending = THREE.AdditiveBlending;
    m.side = THREE.DoubleSide;
    m.uSeed = Math.random() * 100;
    m.uColor = new THREE.Color(color);
    m.uIntensity = intensity;
    return m;
  }, [color, intensity]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((_, delta) => {
    if (animate) material.uTime += delta;
  });

  // ConeGeometry is apex-up and centered: drop it so the apex sits at `position`.
  return (
    <mesh position={[position[0], position[1] - height / 2, position[2]]} frustumCulled={false}>
      <coneGeometry args={[radius, height, 24, 1, true]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
