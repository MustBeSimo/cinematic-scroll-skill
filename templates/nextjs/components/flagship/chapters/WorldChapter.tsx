'use client';

/**
 * WORLD chapter — Tier B (`references/3d-stack.md`): a cinematic environment.
 *
 * A modular hall the scroll-camera flies through. The colonnade is one
 * `instancedMesh` per type (columns + beams) so the whole hall is a handful of
 * draw calls — `3d-stack.md` §3: "anything repeated > 8× must be instanced."
 * When a real `world.glb` arrives it loads via `useGLTF`; until then the
 * procedural hall is the live placeholder.
 *
 * The fly-through itself (the camera dolly) is owned by the parent scroll-camera
 * rig — this chapter just builds the space it travels through.
 */

import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { normalizeToHeight } from '@/lib/normalize-model';
import { LightShaft } from '../fx/LightShaft';

export type WorldChapterProps = {
  anchor: THREE.Vector3;
  modelUrl: string | null;
  scale: number;
  animate: boolean;
  mobile?: boolean;
};

/** Ceiling-light apexes staggered down the hall (anchor-local). */
const SHAFTS: [number, number, number][] = [
  [-2.1, 4.8, -3.5],
  [2.1, 4.8, -8.5],
  [-2.1, 4.8, -13.5],
  [2.1, 4.8, -18.5],
];

export function WorldChapter(props: WorldChapterProps) {
  const shafts = props.mobile ? SHAFTS.slice(0, 2) : SHAFTS;
  return (
    <group>
      {/* The hall's air: drifting dust + staggered volumetric shafts raking
          down between the columns — light with a body, not gray geometry
          dimmed by fog. */}
      <group position={props.anchor}>
        <Sparkles
          count={70}
          scale={[9, 4.5, 26]}
          position={[0, 2.2, -12]}
          size={1.6}
          speed={props.animate ? 0.25 : 0}
          color="#7fd6ff"
          opacity={0.4}
        />
        {shafts.map((p, i) => (
          <LightShaft
            key={i}
            position={p}
            height={5.2}
            radius={1.5}
            color="#3de0ff"
            intensity={0.34}
            animate={props.animate}
          />
        ))}
      </group>
      <Suspense fallback={<ProceduralWorld {...props} />}>
        {props.modelUrl ? <LoadedWorld {...props} modelUrl={props.modelUrl} /> : <ProceduralWorld {...props} />}
      </Suspense>
    </group>
  );
}

function LoadedWorld({ anchor, modelUrl, scale }: WorldChapterProps & { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl, '/draco/');
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    normalizeToHeight(c, 4.2); // hall height the camera rail passes through
    return c;
  }, [scene]);
  return (
    <group position={anchor} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

const PAIRS = 10; // colonnade depth — 2 columns + 1 beam per pair

function ProceduralWorld({ anchor, scale }: WorldChapterProps) {
  const columnsRef = useRef<THREE.InstancedMesh>(null);
  const beamsRef = useRef<THREE.InstancedMesh>(null);
  const stripsRef = useRef<THREE.InstancedMesh>(null);

  // Place instances once (the hall is static; the camera moves, not the world).
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const cols = columnsRef.current;
    const beams = beamsRef.current;
    const strips = stripsRef.current;
    if (cols) {
      let i = 0;
      for (let p = 0; p < PAIRS; p++) {
        const z = -p * 3;
        for (const x of [-2.4, 2.4]) {
          m.makeTranslation(x, 2, z);
          cols.setMatrixAt(i++, m);
        }
      }
      cols.instanceMatrix.needsUpdate = true;
    }
    if (beams) {
      for (let p = 0; p < PAIRS; p++) {
        m.makeTranslation(0, 4.1, -p * 3);
        beams.setMatrixAt(p, m);
      }
      beams.instanceMatrix.needsUpdate = true;
    }
    if (strips) {
      let i = 0;
      for (let p = 0; p < PAIRS; p++) {
        const z = -p * 3 - 1.5;
        for (const x of [-2.0, 2.0]) {
          m.makeTranslation(x, 0.03, z);
          strips.setMatrixAt(i++, m);
        }
      }
      strips.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <group position={anchor} scale={scale}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -PAIRS * 1.5]} receiveShadow>
        <planeGeometry args={[16, PAIRS * 3 + 8]} />
        <meshStandardMaterial color="#0c1018" metalness={0.2} roughness={0.85} />
      </mesh>

      {/* Colonnade — one instancedMesh, 2 columns × PAIRS pairs */}
      <instancedMesh ref={columnsRef} args={[undefined, undefined, PAIRS * 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 4, 16]} />
        <meshStandardMaterial color="#1a2230" metalness={0.3} roughness={0.7} />
      </instancedMesh>

      {/* Coffered beams — one instancedMesh, PAIRS */}
      <instancedMesh ref={beamsRef} args={[undefined, undefined, PAIRS]}>
        <boxGeometry args={[5.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#222c3c" metalness={0.25} roughness={0.65} />
      </instancedMesh>

      {/* Guide-light strips along both floor edges — HDR emissive
          (toneMapped=false pushes them past the bloom threshold), so the
          fly-through reads as a lit cinematic corridor, not gray geometry. */}
      <instancedMesh ref={stripsRef} args={[undefined, undefined, PAIRS * 2]}>
        <boxGeometry args={[0.08, 0.04, 2.4]} />
        <meshStandardMaterial
          color="#3de0ff"
          emissive="#3de0ff"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
