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
import { Sparkles, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { normalizeToHeight } from '@/lib/normalize-model';
import { LightShaft } from '../fx/LightShaft';

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
    <group>
      <FigureStage anchor={props.anchor} animate={props.animate} />
      <Suspense fallback={<ProceduralFigure {...props} />}>
        {props.modelUrl ? <LoadedFigure {...props} modelUrl={props.modelUrl} /> : <ProceduralFigure {...props} />}
      </Suspense>
    </group>
  );
}

/**
 * The figure's stage dressing — shared by the loaded model and the procedural
 * stand-in. Ember motes drift around the dancer, a warm key light pools from
 * above, and an HDR-emissive ring marks the stage on the mirror floor (it
 * blooms on desktop). All of it rides the chapter's presence gate.
 */
function FigureStage({ anchor, animate }: { anchor: THREE.Vector3; animate: boolean }) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const r = ring.current;
    if (!r) return;
    const t = animate ? clock.elapsedTime : 0;
    // The ring breathes on a samba-ish pulse — the stage answers the dance.
    const pulse = 1 + Math.sin(t * 2.1) * 0.03;
    r.scale.setScalar(pulse);
    (r.material as THREE.MeshStandardMaterial).emissiveIntensity =
      1.5 + Math.sin(t * 2.1) * 0.6;
  });

  return (
    <group position={anchor}>
      <Sparkles
        count={90}
        scale={[5, 3.2, 5]}
        position={[0, 1.5, 0]}
        size={2.2}
        speed={animate ? 0.35 : 0}
        color="#ffb270"
        opacity={0.55}
      />
      {/* Concert spotlight — a fake-volumetric cone from above; the dancer
          performs inside a body of light, not in open darkness. */}
      <LightShaft position={[0, 4.4, 0]} height={4.6} radius={1.45} color="#ffb270" intensity={0.4} animate={animate} />
      {/* Warm key from the camera side + above — the light the viewer reads the
          dance by. Sits between camera and figure so it lights the front, not
          the back. */}
      <pointLight position={[0.8, 2.6, 2.6]} intensity={10} color="#ffd2a6" distance={12} />
      {/* Cool back rim — pops the silhouette off the dark stage so the figure
          never sinks into the background. */}
      <pointLight position={[-1.2, 2.4, -2.2]} intensity={6} color="#7fd6ff" distance={9} />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[1.15, 1.3, 64]} />
        <meshStandardMaterial
          color="#ffb270"
          emissive="#ffb270"
          emissiveIntensity={1.6}
          toneMapped={false}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
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
  const { scene, animations } = useGLTF(modelUrl, '/draco/');
  const cloned = useMemo(() => {
    // SkeletonUtils.clone, NOT scene.clone: a plain clone of a skinned mesh
    // keeps referencing the ORIGINAL skeleton, so the figure renders at the
    // world origin at raw size, ignoring this group's position and scale.
    const c = SkeletonUtils.clone(scene);
    normalizeToHeight(c, 1.8); // human height, base at the floor
    return c;
  }, [scene]);

  // STRIP ROOT MOTION. Mixamo dance clips animate the hips' *position*, so the
  // character walks/drifts off the stage ring as it plays. Removing the hips
  // position tracks pins the dance in place — it samba's centered on the ring
  // instead of wandering out of frame. (Bone rotations are untouched, so the
  // motion itself is unchanged; only the global translation is dropped.)
  const inPlace = useMemo(
    () =>
      animations.map((clip) => {
        const c = clip.clone();
        c.tracks = c.tracks.filter((t) => !/hips\.position$/i.test(t.name));
        return c;
      }),
    [animations]
  );
  const { actions } = useAnimations(inPlace, group);

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
