'use client';

/**
 * OBJECT chapter — Tier B (`references/3d-stack.md`): a discrete hero artifact.
 *
 * A premium product showcase. When the manifest carries a real `.glb`, it loads
 * via drei's `useGLTF` (Draco-ready). When `model` is `null` (today) or the
 * file 404s, it renders a procedural faceted "watch-like" prism in PBR
 * metal/rough — the live Tier-C stand-in (`3d-stack.md` §7). The swap is data,
 * not code: the loader decides.
 *
 * Scroll drives a slow auto-rotate + an explode/reassemble; reduced motion
 * holds a single composed frame.
 */

import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, MeshTransmissionMaterial, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type ObjectChapterProps = {
  anchor: THREE.Vector3;
  progress: { current: number };
  animate: boolean;
  /** Manifest `.glb` path, or `null` → procedural placeholder. */
  modelUrl: string | null;
  /** Uniform scale multiplier from the manifest. */
  scale: number;
  /** Lean path: drops the contact-shadow pass (performance-budget §2). */
  mobile?: boolean;
};

export function ObjectChapter(props: ObjectChapterProps) {
  // A real model only when a path is present; otherwise never touch the loader.
  return (
    <Suspense fallback={<ProceduralObject {...props} />}>
      {props.modelUrl ? <LoadedObject {...props} modelUrl={props.modelUrl} /> : <ProceduralObject {...props} />}
    </Suspense>
  );
}

/** Real GLB path: load it; if it throws, Suspense's sibling boundary in the
 *  parent scene swaps to the poster — but the procedural placeholder is the
 *  default until a real asset exists, so this is only reached when `modelUrl`. */
function LoadedObject({
  anchor,
  animate,
  modelUrl,
  scale,
}: ObjectChapterProps & { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, dt) => {
    const g = groupRef.current;
    if (!g) return;
    if (animate) g.rotation.y += dt * 0.3;
    else g.rotation.y = 0.6;
  });

  return (
    <group position={anchor}>
      <group ref={groupRef} scale={scale}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

/** Procedural faceted prism — the Tier-C stand-in. PBR metal/rough, base-center
 *  pivot, front facing -Z (matches the AR/quick-look pivot in `ASSETS-3D.md`). */
function ProceduralObject({ anchor, progress, animate, scale, mobile }: ObjectChapterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Six beveled shards arranged around a core — explode outward on scroll.
  const shards = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return {
          base: new THREE.Vector3(Math.cos(angle) * 0.16, 0.5, Math.sin(angle) * 0.16),
          dir: new THREE.Vector3(Math.cos(angle), 0.2, Math.sin(angle)).normalize(),
          rot: angle,
        };
      }),
    [],
  );

  useFrame((_state, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    if (animate) g.rotation.y += dt * 0.3;
    else g.rotation.y = 0.6;
    // Explode/reassemble: peaks at mid-chapter, closes at the ends.
    const explode = animate ? Math.sin(p * Math.PI) * 0.35 : 0.12;
    shards.forEach((shard, i) => {
      const mesh = shardRefs.current[i];
      if (!mesh) return;
      mesh.position.set(
        shard.base.x + shard.dir.x * explode,
        shard.base.y + shard.dir.y * explode,
        shard.base.z + shard.dir.z * explode,
      );
    });
  });

  return (
    <group position={anchor}>
      <group ref={groupRef} scale={scale}>
        {/* Core — refractive jewel. Transmission is the Mode-B flex: real
            refraction + chromatic fringe that the no-build Mode A can't match. */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <icosahedronGeometry args={[0.18, 0]} />
          <MeshTransmissionMaterial
            samples={6}
            transmission={1}
            thickness={0.45}
            ior={1.5}
            roughness={0.08}
            chromaticAberration={0.05}
            anisotropicBlur={0.2}
            distortion={0.12}
            color="#dfe8ff"
          />
        </mesh>
        {/* Faceted shards — brushed metal, tight roughness for IBL speculars */}
        {shards.map((shard, i) => (
          <mesh
            key={i}
            ref={(m) => {
              shardRefs.current[i] = m;
            }}
            position={shard.base}
            rotation={[0, shard.rot, 0.3]}
            castShadow
          >
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#9fb0d0" metalness={0.9} roughness={0.16} />
          </mesh>
        ))}
        {/* Plinth (base on the floor plane) */}
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <cylinderGeometry args={[0.4, 0.45, 0.04, 48]} />
          <meshStandardMaterial color="#11151f" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
      {/* Soft grounding shadow — sells "object on a surface" instantly. Static
          scenes bake one frame; mobile skips the extra pass entirely. */}
      {!mobile ? (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.55}
          scale={4}
          blur={2.4}
          far={2}
          resolution={256}
          frames={animate ? Infinity : 1}
        />
      ) : null}
    </group>
  );
}
