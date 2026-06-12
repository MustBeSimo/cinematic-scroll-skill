/**
 * Flagship (Mode B — React Three Fiber + WebXR) data layer.
 *
 * Mirrors the vanilla Mode-A flagship (`examples/flagship/`) — the same four
 * movements (OBJECT · WORLD · FIELD · FIGURE), the same "one choreography, two
 * media" contract (`references/3d-stack.md` §5). DOM copy lives in `chapters`;
 * the 3D hand-off (model / usdz / poster / scale / cameraNodes / clips / ar)
 * lives in `assetManifest`, matching the schema in `ASSETS-3D.md` §6.
 *
 * Runs today with ZERO assets: every `model` is `null` → procedural placeholder.
 * Drop a real `.glb` path into `assetManifest` and the loader swaps it in with
 * no code change (the chapter component resolves it via `useGLTF` with a
 * graceful fallback — `references/3d-stack.md` §7).
 */

/** The four flagship chapters, in scroll order. */
export type FlagshipChapterId = 'object' | 'world' | 'field' | 'figure';

/** Per-chapter DOM copy + accent (drives the HTML overlay, not the GL scene). */
export type FlagshipChapter = {
  id: FlagshipChapterId;
  roman: string;
  eyebrow: string;
  /** Title rendered as stacked lines; the `accent` line is edge-lit cyan. */
  title: { line: string; accent?: boolean }[];
  lede: string;
  accent: string;
  /** Atmospheric background morph (CSS) for this chapter's overlay band. */
  morph: string;
  /** Offer immersive Enter-VR for this chapter (gated on feature detection). */
  vr?: boolean;
  /** Offer AR (immersive-ar + model-viewer quick-look) for this chapter. */
  ar?: boolean;
  /** Optional call-to-action shown in the overlay. */
  cta?: { label: string; href: string };
};

/**
 * 3D asset hand-off entry — one per chapter. Identical schema to
 * `examples/flagship/assets-3d/manifest.json` (see `ASSETS-3D.md` §6).
 * `model: null` keeps the chapter procedural; a resolving path upgrades it.
 */
export type FlagshipAssetEntry = {
  /** Display label for the chapter. */
  label: string;
  /** `.glb` path (public/), or the literal `'procedural'` for no model (Field is always procedural). */
  runtime: string;
  /** `.usdz` path for iOS AR quick-look, or `null` when no AR. */
  iosAr: string | null;
  /** `.webp` static fallback — shown before load, on context loss, reduced motion. */
  fallbackPoster: string;
  /** Uniform multiplier on the model's metric units (1.0 = as authored). */
  scale: number;
  /** Pivot/origin convention for the runtime model (e.g. `'base-center'`). */
  pivot?: string;
  /** World only — ordered camera node names; `[]` → runtime-generated path. */
  cameraNodes?: string[];
  /** Figure only — animation clip names; `[]` → static pose. */
  animations?: string[];
  /** Field only — procedural shader id. */
  shader?: string;
};

export const flagshipChapters: FlagshipChapter[] = [
  {
    id: 'object',
    roman: '01',
    eyebrow: 'Movement I · The Object',
    title: [{ line: 'Precision' }, { line: 'in Form', accent: true }],
    lede: 'A single artifact, machined from one idea. The camera orbits as the form breathes apart and reassembles — every facet catching the light it was cut for. A premium product, rendered in real time, placeable on your desk at true scale.',
    accent: '#3de0ff',
    morph:
      'radial-gradient(120% 90% at 70% 12%, rgba(61,224,255,.10), rgba(61,224,255,0) 55%), radial-gradient(120% 100% at 50% 100%, rgba(5,6,11,.7), rgba(5,6,11,0) 60%)',
    ar: true,
  },
  {
    id: 'world',
    roman: '02',
    eyebrow: 'Movement II · The World',
    title: [{ line: 'Into the' }, { line: 'Hall', accent: true }],
    lede: 'A modular architecture assembled from instanced light — colonnade after colonnade receding into atmospheric haze. Scroll is the dolly: the camera flies the length of the hall on an authored path. Enter it at room scale in VR.',
    accent: '#3de0ff',
    morph:
      'radial-gradient(130% 100% at 30% 10%, rgba(27,58,102,.32), rgba(7,10,20,0) 58%), radial-gradient(90% 70% at 88% 92%, rgba(61,224,255,.10), rgba(61,224,255,0) 55%)',
    vr: true,
  },
  {
    id: 'field',
    roman: '03',
    eyebrow: 'Movement III · The Field',
    title: [{ line: 'The Math' }, { line: 'is the Image', accent: true }],
    lede: 'No model, no texture, no asset to 404 — only a custom GLSL field running on the GPU, flowing and folding in answer to your scroll. This is the always-works hero: it degrades by lowering resolution, never by going blank.',
    accent: '#3de0ff',
    morph:
      'radial-gradient(120% 100% at 50% 0%, rgba(36,21,70,.5), rgba(7,10,20,0) 60%), radial-gradient(70% 60% at 50% 60%, rgba(61,224,255,.14), rgba(61,224,255,0) 60%)',
  },
  {
    id: 'figure',
    roman: '04',
    eyebrow: 'Movement IV · The Figure',
    title: [{ line: 'Meet the' }, { line: 'Figure', accent: true }],
    lede: 'A rigged dancer, samba playing out of the box — planted on its stage ring, lit by a single concert spotlight. Swap in any avatar via the manifest with zero code change. Stand beside it in AR, or step into the same space in VR.',
    accent: '#ffb270',
    morph:
      'radial-gradient(120% 100% at 70% 14%, rgba(255,178,112,.10), rgba(255,178,112,0) 52%), radial-gradient(110% 90% at 24% 100%, rgba(36,21,70,.42), rgba(7,10,20,0) 60%)',
    vr: true,
    ar: true,
    cta: { label: 'View the source', href: 'https://github.com/MustBeSimo/cinematic-scroll-skill' },
  },
];

/**
 * 3D asset manifest, keyed by chapter id. Every entry is `runtime: 'procedural'`
 * today. Point `runtime`/`iosAr` at real files in `public/` to upgrade — see
 * `ASSETS-3D.md`. Paths are public-relative (served from the web root). This is
 * the single source of runtime asset paths; AR lights up when `iosAr` is set.
 */
export const assetManifest: Record<FlagshipChapterId, FlagshipAssetEntry> = {
  object: {
    label: 'Object',
    runtime: '/flagship/object/object.glb', // e.g. '/flagship/object/object.glb'
    iosAr: null, // e.g. '/flagship/object/object.usdz'
    fallbackPoster: '/flagship/object/poster.svg',
    scale: 2.5, // hero framing — the watch fills the frame instead of sitting small on the floor
    pivot: 'base-center',
    cameraNodes: [],
  },
  world: {
    label: 'World',
    runtime: '/flagship/world/world.glb',
    iosAr: null,
    fallbackPoster: '/flagship/world/poster.svg',
    scale: 1.0,
    cameraNodes: ['Camera_Start', 'Camera_Mid', 'Camera_End'],
  },
  field: {
    label: 'Field',
    runtime: 'procedural', // Field is always procedural — never a GLB
    shader: 'aurora-particle-field',
    iosAr: null,
    fallbackPoster: '/flagship/field/poster.svg',
    scale: 1.0,
  },
  figure: {
    label: 'Figure',
    // dancer.glb = rigged + animated (Mixamo-rigged character, SambaDance clip)
    // — works end-to-end with zero manual rigging. The generated android
    // sculpture is still at /flagship/figure/figure.glb: swap `runtime` back
    // for a still figure, or rig it (ASSETS-3D.md §4) and overwrite dancer.glb.
    runtime: '/flagship/figure/dancer.glb',
    iosAr: null,
    fallbackPoster: '/flagship/figure/poster.svg',
    scale: 1.0,
    animations: ['SambaDance'],
    cameraNodes: [],
  },
};

/**
 * Scroll runway per chapter, in viewport-heights. One page per chapter makes
 * the 48-unit camera journey feel like hard cuts — chapters need DWELL
 * (taste-guardrails pacing: arrive, hold, depart). Two pages each gives the
 * camera room to settle at an anchor before easing into transit.
 * `FlagshipOverlay` sizes each chapter panel to match (`min-h-[200vh]`).
 */
export const PAGES_PER_CHAPTER = 2;

/** Number of scroll "pages" the chapter rail spans (drei ScrollControls). */
export const FLAGSHIP_PAGES = flagshipChapters.length * PAGES_PER_CHAPTER;
