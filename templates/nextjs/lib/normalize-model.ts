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
  root.updateWorldMatrix(true, true);

  const box = measureWorldBox(root);
  if (box.isEmpty()) return;

  const size = new THREE.Vector3();
  box.getSize(size);
  const s = size.y > 1e-6 ? height / size.y : 1;
  root.scale.multiplyScalar(s);

  // Re-measure after scaling: center X/Z, sit the base on the floor.
  root.updateWorldMatrix(true, true);
  const scaled = measureWorldBox(root);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaled.min.y;
}

/**
 * World-space bounding box that is correct for SKINNED meshes too.
 *
 * `Box3.setFromObject` measures a skinned mesh from its *bind-pose geometry*,
 * which for rigged exports (e.g. Mixamo) is authored in a tiny local unit while
 * the real size lives in the bone matrices — so `setFromObject` reports a box a
 * fraction of a unit across and `normalizeToHeight` then blows the figure up
 * ~100×. `SkinnedMesh.computeBoundingBox()` re-derives the box from the *posed*
 * vertices (it runs the skinning through the bone world matrices), giving the
 * size the viewer actually sees. Because those bone matrices already carry the
 * full transform chain, the resulting box is in the root's own frame — it must
 * NOT be re-multiplied by the mesh's `matrixWorld` (doing so double-counts the
 * scale and inflates the figure ~400×). We union the posed boxes directly and
 * fall back to `setFromObject` only when there is no skinned mesh in the tree.
 */
function measureWorldBox(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  let sawSkinned = false;

  root.traverse((o) => {
    const sm = o as THREE.SkinnedMesh;
    if (sm.isSkinnedMesh && sm.skeleton) {
      sawSkinned = true;
      sm.computeBoundingBox(); // pose-aware; box already in the root's frame
      if (sm.boundingBox) box.union(sm.boundingBox);
    }
  });

  if (!sawSkinned) box.setFromObject(root);
  return box;
}
