import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/** Dispose a privately owned glTF, never a shared useGLTF cache entry. */
export function disposeGLTF(gltf: GLTF) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  const bitmaps = new Set<ImageBitmap>();
  for (const scene of gltf.scenes) scene.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) materials.add(material);
    const skeleton = (object as THREE.SkinnedMesh).skeleton;
    if (skeleton?.boneTexture) textures.add(skeleton.boneTexture);
  });
  for (const material of materials) for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
  for (const texture of textures) {
    if (typeof ImageBitmap !== 'undefined' && texture.source?.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
    texture.dispose();
  }
  bitmaps.forEach(bitmap => bitmap.close()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
}

/** Decoder workers are renderer-scoped. Self-host decoder files from the pinned Three package. */
export function createAssetLoader(renderer: THREE.WebGLRenderer, { dracoPath, basisPath }: { dracoPath?: string; basisPath?: string } = {}) {
  const manager = new THREE.LoadingManager(), loader = new GLTFLoader(manager);
  const draco = dracoPath ? new DRACOLoader(manager).setDecoderPath(dracoPath).setWorkerLimit(2) : null;
  const ktx2 = basisPath ? new KTX2Loader(manager).setTranscoderPath(basisPath).setWorkerLimit(2).detectSupport(renderer) : null;
  if (draco) loader.setDRACOLoader(draco);
  if (ktx2) loader.setKTX2Loader(ktx2);
  loader.setMeshoptDecoder(MeshoptDecoder);
  let disposed = false;
  const pending = new Set<() => void>(), owned = new Set<GLTF>();
  return {
    load(url: string, { signal, timeoutMs = 15000 }: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<{ gltf: GLTF; dispose: () => void }> {
      if (disposed) return Promise.reject(new Error('Asset loader disposed'));
      return new Promise((resolve,reject) => {
        let settled = false;
        const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort',cancel); pending.delete(cancel); };
        const fail = (error: unknown) => { if (settled) return; settled = true; cleanup(); reject(error); };
        const cancel = () => fail(new DOMException('Asset request cancelled','AbortError'));
        const timer = setTimeout(() => fail(new Error('Asset load timed out: '+url)),Math.max(1,timeoutMs));
        pending.add(cancel); signal?.addEventListener('abort',cancel,{once:true});
        if (signal?.aborted) { cancel(); return; }
        // Decoder/subresource work may finish after cancellation. Late results are
        // disposed instead of being attached to an unmounted scene.
        loader.load(url,gltf => {
          if (settled || disposed) { disposeGLTF(gltf); return; }
          settled = true; cleanup(); owned.add(gltf);
          resolve({ gltf, dispose() { if (owned.delete(gltf)) disposeGLTF(gltf); } });
        },undefined,fail);
      });
    },
    dispose() {
      if (disposed) return; disposed = true;
      [...pending].forEach(cancel => cancel()); owned.forEach(disposeGLTF); owned.clear(); draco?.dispose(); ktx2?.dispose();
    },
  };
}

/** Convert a loaded HDR texture once, then dispose only the owned PMREM target. */
export function createEnvironmentMap(renderer: THREE.WebGLRenderer, texture: THREE.Texture) {
  const generator = new THREE.PMREMGenerator(renderer);
  try {
    const target = generator.fromEquirectangular(texture);
    return { texture: target.texture, dispose: () => target.dispose() };
  } finally { generator.dispose(); }
}
