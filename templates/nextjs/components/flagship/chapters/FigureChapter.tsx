'use client';

/**
 * FIGURE chapter — Tier B (`references/3d-stack.md`): an avatar the user meets.
 *
 * A stylized humanoid built from primitives with a gentle idle (breathing
 * weight-shift) — the live stand-in for a rigged `.glb` avatar that drops in via
 * the manifest with zero code change (`ASSETS-3D.md` §4). When a real model is
 * present it loads via `useGLTF` and its `idle` clip plays through drei's
 * `useAnimations`; otherwise the primitive figure holds its procedural idle.
 *
 * Pivot is between the feet on the floor, facing -Z — matches the AR/quick-look
 * spec so the swap needs no offset hacks.
 */

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { normalizeToHeight } from '@/lib/normalize-model';

export type FigureChapterProps = {
  anchor: THREE.Vector3;
  animate: boolean;
  modelUrl: string | null;
  scale: number;
  /** Animation clip names to play (e.g. `['idle']`). */
  clips: string[];
};

export function FigureChapter(props: FigureChapterProps) {
  return (
    <Suspense fallback={<ProceduralFigure {...props} />}>
      {props.modelUrl ? <LoadedFigure {...props} modelUrl={props.modelUrl} /> : <ProceduralFigure {...props} />}
    </Suspense>
  );
}

function LoadedFigure({
  anchor,
  animate,
  modelUrl,
  scale,
  clips,
}: FigureChapterProps & { modelUrl: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const cloned = useMemo(() => {
    // SkeletonUtils.clone, NOT scene.clone: a plain clone of a skinned mesh
    // keeps referencing the ORIGINAL skeleton, so the figure renders at the
    // world origin at raw size, ignoring this group's position and scale.
    const c = SkeletonUtils.clone(scene);
    normalizeToHeight(c, 1.7); // human height, base at the floor
    return c;
  }, [scene]);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (!animate) return;
    // Prefer the first manifest-listed clip that exists; fall back to the first.
    const name = clips.find((c) => actions[c]) ?? Object.keys(actions)[0];
    const action = name ? actions[name] : undefined;
    action?.reset().fadeIn(0.4).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, animate, clips]);

  return (
    <group position={anchor}>
      <group ref={group} scale={scale}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

/** Primitive humanoid — capsules + sphere + a cyan visor band. Gentle idle. */
function ProceduralFigure({ anchor, animate, scale }: FigureChapterProps) {
  const root = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    if (animate) {
      const t = state.clock.elapsedTime;
      // Breathing weight-shift: subtle bob + sway, stable horizon (no roll).
      g.position.y = Math.sin(t * 1.4) * 0.015;
      g.rotation.y = Math.sin(t * 0.5) * 0.08;
    } else {
      g.position.y = 0;
      g.rotation.y = 0;
    }
  });

  const skin = useMemo(() => ({ color: '#c8ccd6', metalness: 0.1, roughness: 0.6 }), []);

  return (
    <group position={anchor}>
      {/* Halo ring + rim-light behind the figure — HDR emissive (blooms on
          desktop), silhouettes the avatar instead of leaving it in the dark. */}
      <mesh position={[0, 1.1, -0.9]}>
        <torusGeometry args={[0.85, 0.018, 16, 72]} />
        <meshStandardMaterial
          color="#3de0ff"
          emissive="#3de0ff"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 1.3, -0.7]} intensity={7} color="#3de0ff" distance={6} />
      {/* Pivot between the feet on the floor (0,0,0), facing -Z. */}
      <group ref={root} scale={scale}>
        {/* Head */}
        <mesh position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial {...skin} />
        </mesh>
        {/* Visor band */}
        <mesh position={[0, 1.64, 0.1]} rotation={[0.05, 0, 0]}>
          <boxGeometry args={[0.2, 0.05, 0.06]} />
          <meshStandardMaterial color="#3de0ff" emissive="#3de0ff" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.5, 8, 16]} />
          <meshStandardMaterial {...skin} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.24, 1.2, 0]} rotation={[0, 0, 0.18]} castShadow>
          <capsuleGeometry args={[0.05, 0.5, 6, 12]} />
          <meshStandardMaterial {...skin} />
        </mesh>
        <mesh position={[0.24, 1.2, 0]} rotation={[0, 0, -0.18]} castShadow>
          <capsuleGeometry args={[0.05, 0.5, 6, 12]} />
          <meshStandardMaterial {...skin} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.09, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.6, 6, 12]} />
          <meshStandardMaterial {...skin} />
        </mesh>
        <mesh position={[0.09, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.6, 6, 12]} />
          <meshStandardMaterial {...skin} />
        </mesh>
      </group>
    </group>
  );
}
