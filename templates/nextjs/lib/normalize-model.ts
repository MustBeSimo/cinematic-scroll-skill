import * as THREE from 'three';

/**
 * Uniformly scales and repositions a loaded model so it stands `height` world
 * units tall, centered on X/Z, with its base resting at y = 0.
 *
 * Generated GLBs (fal.ai Trellis / Hunyuan3D / Rodin) and third-party models
 * arrive in arbitrary units and offsets — without this, a swapped-in model can
 * be microscopic, building-sized, or floating. Every `Loaded*` chapter calls
 * this on entry, so the manifest's `scale` stays a *creative* multiplier on a
 * predictable baseline instead of a unit-conversion guess.
 */
export function normalizeToHeight(root: THREE.Object3D, height: number): void {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;

  const size = new THREE.Vector3();
  box.getSize(size);
  const s = size.y > 1e-6 ? height / size.y : 1;
  root.scale.multiplyScalar(s);

  // Re-measure after scaling: center X/Z, sit the base on the floor.
  const scaled = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaled.min.y;
}
