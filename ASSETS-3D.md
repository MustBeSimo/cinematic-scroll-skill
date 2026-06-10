# 3D Asset Spec — cinematic-scroll-skill

> The hand-off doc for the repo owner. Single source of truth for every 3D model the
> flagship wants. Grounded in the actual render code (manifest paths, units, pivots) — deliver
> to this spec and the files drop in **with no code change**.
>
> **Important:** the flagship runs **today with zero 3D assets.** Every chapter renders a
> **procedural placeholder** (parametric geometry with the right silhouette, PBR material,
> pivot, and scroll-camera) until a real file is dropped in. These models are an *enhancement*,
> not a dependency — you can deploy and screenshot the flagship now, then richen it as assets
> arrive. See `references/3d-stack.md` §7.

The swap is **data, not code.** The flagship reads `examples/flagship/assets-3d/manifest.json`.
When a chapter's `model` path resolves and loads clean, the real GLB replaces the placeholder.
When it 404s or fails to load, the placeholder stays. There is no per-chapter `if` to edit —
the loader decides. Your job is to deliver files to the spec and list them in the manifest.

The tiers, triangle budgets, and conversion targets below are the *same numbers* the runtime
enforces (`references/3d-stack.md` §3). A model over budget is rejected at the door, not
optimized at runtime.

---

## 0. Global rules (apply to every model)

| Rule | Requirement | Why |
|---|---|---|
| Container format | **`.glb`** (binary glTF 2.0), Draco-compressed mesh | One file, embedded buffers/textures, web-native. |
| iOS AR format | **`.usdz`** where AR quick-look is offered | iOS Quick Look does not read glTF. See `webxr.md` §4. |
| Units | **meters, real-world scale** | `ar-scale="fixed"` shows the object at true size. A 30cm object is `0.3`, not `30`. |
| Up axis | **+Y up**, **-Z forward** (glTF convention) | Matches Three / R3F default camera. Re-bake if your DCC is Z-up. |
| Pivot / origin | **base-center on the floor plane** (object footprint centered at world `(0,0,0)`, sitting on +Y) | Lets the runtime place it on the ground at scale `1` with no offset hacks. Per-chapter pivots noted below. |
| Scale baked | **transforms applied / frozen** (scale 1,1,1; rotation 0) | Un-applied transforms break instancing, physics, and AR scaling. |
| Materials | **PBR metal/rough** (glTF `pbrMetallicRoughness`) | The renderer is `ACESFilmic` + `SRGBColorSpace` (`3d-stack.md` §3). Spec/gloss won't read right. |
| Textures | **≤ 2048² per map**, power-of-two, KTX2/Basis preferred (else WebP/JPEG) | Texture-size cap (`3d-stack.md` §3). KTX2 stays compressed on the GPU. |
| No baked UI text | **no labels, captions, watermarks, or HUD text baked into textures** | UI/copy is the page's job; baked text can't be translated, restyled, or kept crisp. |
| No baked lighting on hero objects | Object/Figure use scene lights + an env map; **World may bake** (noted below) | Hero objects must relight as the scroll-camera moves; a static environment can bake. |
| Naming | lowercase, hyphenated, chapter-scoped folder | Matches manifest paths; no spaces. |
| Triangulation | triangles only (no n-gons/quads in export) | glTF is triangle-based; n-gons triangulate unpredictably. |

Folder layout the manifest expects:

```
examples/flagship/assets-3d/
├── manifest.json
├── object/   object.glb   object.usdz   poster.webp
├── world/    world.glb                  poster.webp
├── field/    (none — procedural)        poster.webp
└── figure/   figure.glb   figure.usdz   poster.webp
```

`poster.webp` is the static fallback every chapter needs (`3d-stack.md` §4) — a representative
still shown before load, under reduced motion, on context loss, and on the budget mobile tier.
Deliver one per chapter (1600×1000, ≤ 200KB) even for the procedural Field.

---

## 1. Chapter — Object (premium product showcase)

The hero artifact. The scroll-camera orbits it; phones place it in the room via AR quick-look.

| Field | Spec |
|---|---|
| Files | `object/object.glb` (Draco) **+** `object/object.usdz` (iOS AR) **+** `object/poster.webp` |
| Triangle budget | **≤ 150k** |
| Draw calls | ≤ 60 (merge sub-meshes that share a material) |
| Textures | ≤ 6 maps, ≤ 2048² each |
| Units | meters, true size (a watch is ~0.04m, a chair ~0.9m) |
| Pivot | **base-center on the floor** — the point the object naturally rests on, at `(0,0,0)` |
| Materials | PBR metal/rough; clean, accurate metalness/roughness; subtle normal map OK |
| Lighting | **not baked** — relit by scene lights + env map as the camera orbits |
| AR | required (`.usdz`, `ar-scale="fixed"`) — the user puts it on their desk at true size |

Deliver the front of the object facing **-Z** so the chapter's opening camera frames it head-on.

---

## 2. Chapter — World (cinematic environment fly-through)

A space the scroll-camera flies through. Built for traversal, not a single hero angle.

| Field | Spec |
|---|---|
| Files | `world/world.glb` (Draco) **+** `world/poster.webp` |
| Triangle budget | **≤ 500k total** (the whole scene, all props) |
| Draw calls | ≤ 150 (instance everything repeated — see below) |
| Textures | ≤ 12 maps, ≤ 2048² each (atlas where sensible) |
| Units | meters, real architectural scale (a doorway ~2.1m tall) |
| Pivot | world origin at the **camera-path start / scene anchor**, floor on +Y |
| Materials | PBR metal/rough |
| Lighting | **baked lighting preferred** (lightmaps / vertex bake) for a fixed environment — cheaper and more cinematic than realtime GI |
| Instancing | anything repeated > 8× (columns, foliage, props) **must** be instanced or marked for instancing |
| AR | not required |

**Named camera-path nodes (required).** The fly-through camera follows nodes you author in
the scene so the cinematography is yours, not guessed. Name empties/nodes:

```
cam_start, cam_01, cam_02, … cam_end      (waypoints, in order)
cam_look_start, cam_look_01, …            (optional look-at targets per waypoint)
```

List these node names in the manifest's `cameraNodes` for this chapter. If absent, the
runtime falls back to a generated CatmullRom path through the scene bounds — functional, but
your authored path is the cinematic one. Keep waypoints inside the geometry (no clipping
through walls) and the path smooth (no hairpins → no nausea if ever taken to XR).

---

## 3. Chapter — Field (abstract procedural shader)

**No asset.** The visual is the math — a procedural shader field (`3d-stack.md` tier C). It
ships complete with zero files and never 404s; it degrades by lowering resolution, not by
going blank.

| Field | Spec |
|---|---|
| Files | **none** (procedural) — deliver only `field/poster.webp` for the static fallback |
| Triangle budget | n/a (full-screen quads / instanced points) |
| Manifest `model` | `null` |

Do not deliver a GLB for Field. If you want to art-direct it, that's a shader-parameter
conversation (palette, flow speed, density), not an asset hand-off.

---

## 4. Chapter — Figure (avatar — HyperFrames tie-in)

A rigged humanoid the user meets — viewable in AR and immersive XR. This is the only chapter
with an **animation rig requirement.**

| Field | Spec |
|---|---|
| Files | `figure/figure.glb` (Draco, **rigged + animated**) **+** `figure/figure.usdz` **+** `figure/poster.webp` |
| Triangle budget | **≤ 80k** |
| Draw calls | ≤ 40 |
| Textures | ≤ 5 maps, ≤ 2048² each |
| Units | meters, true human scale (~1.7–1.8m tall) |
| Pivot | **between the feet on the floor** at `(0,0,0)`, facing **-Z** |
| Materials | PBR metal/rough; skin/cloth via albedo + normal + roughness |
| Lighting | not baked — relit by scene lights |
| AR | required (`.usdz` exports the rig + first clip for Quick Look) |

**Rig requirement:**

- **Humanoid skeleton, Mixamo-compatible bone names** (`mixamorig:Hips`, `…Spine`,
  `…LeftArm`, etc.) — this makes the rig retargetable and lets you drop in Mixamo clips.
- **1–2 animation clips minimum:** one **idle** (looping, subtle breathing/weight-shift) and
  optionally one **gesture** (a wave, a turn, a greeting). Clips embedded in the GLB as glTF
  animations, named clearly (`idle`, `gesture`).
- Skinning ≤ 4 bone influences per vertex (glTF limit; most engines clamp to 4).
- USDZ: export with the idle clip baked so iOS Quick Look shows it animating.

List clip names in the manifest so the runtime can play them; if no clips are present, the
figure renders as a static pose (still valid).

---

## 5. Conversion path (`.fbx` → `.glb` → Draco → `.usdz`)

`.fbx` is accepted as **source** (it's what Mixamo and most DCCs export with rigs). The
runtime consumes **`.glb` + `.usdz`** only. Convert once, at delivery:

```
                ┌─────────────────────────────────────────────┐
  DCC / Mixamo  │  .fbx (or .gltf)  ── source, rig + clips     │
                └───────────────┬─────────────────────────────┘
                                │  FBX2glTF  (or Blender export)
                                ▼
                         .glb (uncompressed)
                                │  Draco mesh compression
                                ▼
                    ┌──────────────────────┐        ┌──────────────────────┐
                    │  gltf-pipeline -d     │   or   │  gltfpack -cc         │
                    │  (Draco)              │        │  (meshopt — alt.)     │
                    └──────────┬───────────┘        └──────────────────────┘
                               ▼
                    .glb (Draco)  ── ships to web + Android Scene Viewer
                               │
                               │  Reality Converter (macOS GUI)  /  USD tools (usdzconvert)
                               ▼
                    .usdz  ── ships to iOS Quick Look
```

Tooling, concretely:

| Step | Tool | Command (illustrative) |
|---|---|---|
| FBX → glTF | **FBX2glTF** (Meta) or Blender "glTF 2.0" export | `FBX2glTF -i figure.fbx -o figure.glb --pbr-metallic-roughness` |
| Draco compress | **gltf-pipeline** | `gltf-pipeline -i figure.glb -o figure.glb -d` |
| (alt.) compress | **gltfpack** (meshoptimizer) | `gltfpack -i figure.glb -o figure.glb -cc` |
| Texture → KTX2 | **toktx** / gltf-transform | `gltf-transform etc1s figure.glb figure.glb` |
| glTF → USDZ | **Reality Converter** (macOS) or **usdzconvert** (Apple USD tools) | `usdzconvert figure.glb figure.usdz` |

Notes:

- **Draco vs meshopt:** the runtime loads **Draco** (it wires `DRACOLoader` —
  `3d-stack.md` §2). If you ship meshopt (`gltfpack -cc`) instead, say so in the hand-off so
  the loader gets the meshopt decoder; otherwise default to **Draco**.
- **Validate** every `.glb` against the glTF validator (`gltf-transform validate` or the
  Khronos validator) before delivery — broken accessors / missing buffers fail silently as a
  blank chapter.
- **Check the budget after compression:** report final triangle count and `.glb` byte size
  per chapter. Over the §0/per-chapter caps → rework, don't ship.
- **USDZ scale check:** open the `.usdz` in Quick Look and confirm it appears at real-world
  size (the meters/`ar-scale="fixed"` chain). Re-baked scale is the #1 USDZ bug.

---

## 6. `manifest.json` schema

The flagship reads `examples/flagship/assets-3d/manifest.json`. It maps each **chapter** to
its files, scale, and (for World) camera nodes. Deliver files to the paths here and they load;
omit a chapter or set `model: null` and it stays procedural.

### Schema

```jsonc
{
  "version": 1,                 // schema version (integer)
  "basePath": "assets-3d/",     // resolved relative to examples/flagship/ ; paths below are relative to this
  "chapters": {
    "<chapterId>": {            // one of: "object" | "world" | "field" | "figure"
      "model":  "string|null",  // .glb path under basePath, or null for procedural (Field)
      "usdz":   "string|null",  // .usdz path for iOS AR quick-look, or null if no AR
      "poster": "string",       // .webp static fallback (always present, even procedural)
      "scale":  1.0,            // uniform multiplier on top of the model's metric units (1.0 = as authored)
      "cameraNodes": [],        // ordered node names for the fly-through (World); [] = generated path
      "clips":  [],             // animation clip names to play (Figure); [] = static pose
      "ar":     false           // offer AR quick-look for this chapter (requires usdz)
    }
  }
}
```

Field meanings and rules:

| Key | Type | Rule |
|---|---|---|
| `version` | integer | Schema version. Currently `1`. |
| `basePath` | string | Folder (under `examples/flagship/`) all asset paths resolve against. |
| `chapters` | object | Keyed by chapter id. Missing chapter → that chapter stays procedural. |
| `model` | string \| null | `.glb` path, or `null` (Field is always `null`). A 404 here → placeholder, no error. |
| `usdz` | string \| null | `.usdz` path; required when `ar: true`, else `null`. |
| `poster` | string | Required for every chapter. The static fallback image. |
| `scale` | number | Multiplier on the model's own metric units. Keep `1.0` if you authored at true scale (you should). |
| `cameraNodes` | string[] | World only — ordered `cam_*` node names (§2). Empty → runtime generates a path. |
| `clips` | string[] | Figure only — clip names (`idle`, `gesture`). Empty → static pose. |
| `ar` | boolean | `true` only if a valid `usdz` is present and the chapter should offer quick-look. |

### Example (with placeholders — what ships today)

`examples/flagship/assets-3d/manifest.json` follows this shape. Until real files arrive, the
paths can point at not-yet-present files (the loader 404s gracefully to the procedural
placeholder) — so this manifest is valid and live *before* any model exists:

```json
{
  "version": 1,
  "basePath": "assets-3d/",
  "chapters": {
    "object": {
      "model": "object/object.glb",
      "usdz": "object/object.usdz",
      "poster": "object/poster.webp",
      "scale": 1.0,
      "cameraNodes": [],
      "clips": [],
      "ar": true
    },
    "world": {
      "model": "world/world.glb",
      "usdz": null,
      "poster": "world/poster.webp",
      "scale": 1.0,
      "cameraNodes": ["cam_start", "cam_01", "cam_02", "cam_end"],
      "clips": [],
      "ar": false
    },
    "field": {
      "model": null,
      "usdz": null,
      "poster": "field/poster.webp",
      "scale": 1.0,
      "cameraNodes": [],
      "clips": [],
      "ar": false
    },
    "figure": {
      "model": "figure/figure.glb",
      "usdz": "figure/figure.usdz",
      "poster": "figure/poster.webp",
      "scale": 1.0,
      "cameraNodes": [],
      "clips": ["idle", "gesture"],
      "ar": true
    }
  }
}
```

---

## 7. Delivery checklist (per chapter)

- [ ] `.glb`, binary glTF 2.0, **Draco**-compressed (or flagged meshopt).
- [ ] Triangle count **under** the chapter cap (Object ≤150k · World ≤500k · Figure ≤80k · Field none).
- [ ] **Meters, true scale**; transforms applied (scale 1, rotation 0).
- [ ] Pivot per chapter (Object/World base on floor; Figure between feet); front faces **-Z**.
- [ ] PBR **metal/rough** materials; **no baked UI text**; hero objects **not** light-baked.
- [ ] Textures ≤ 2048², power-of-two, KTX2/WebP.
- [ ] `.usdz` present for any AR chapter (Object, Figure); opens at real-world size in Quick Look.
- [ ] World: named `cam_*` path nodes authored and listed in `cameraNodes`.
- [ ] Figure: Mixamo-compatible humanoid rig; **1–2 clips** (`idle` + optional `gesture`); ≤4 influences/vertex.
- [ ] `poster.webp` delivered for every chapter (incl. procedural Field), ≤ 200KB.
- [ ] glTF validator clean; final tri-count + byte-size reported.
- [ ] Entry added/updated in `examples/flagship/assets-3d/manifest.json` (the schema in §6).

Drop the files in, list them in the manifest, and the flagship upgrades from procedural
placeholder to real asset — **zero code change.**
```
