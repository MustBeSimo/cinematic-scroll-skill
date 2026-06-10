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
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export type WorldChapterProps = {
  anchor: THREE.Vector3;
  modelUrl: string | null;
  scale: number;
};

export function WorldChapter(props: WorldChapterProps) {
  return (
    <Suspense fallback={<ProceduralWorld {...props} />}>
      {props.modelUrl ? <LoadedWorld {...props} modelUrl={props.modelUrl} /> : <ProceduralWorld {...props} />}
    </Suspense>
  );
}

function LoadedWorld({ anchor, modelUrl, scale }: WorldChapterProps & { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(true), [scene]);
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

  // Place instances once (the hall is static; the camera moves, not the world).
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const cols = columnsRef.current;
    const beams = beamsRef.current;
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
    </group>
  );
}
