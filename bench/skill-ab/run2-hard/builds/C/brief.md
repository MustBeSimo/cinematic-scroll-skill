# Brief — Meridian Vessel

Build a single-page launch site for **Meridian**, a hand-thrown stoneware vessel
from a small studio. The hero is the object itself, in real 3D, lit like a museum
piece. The page should feel precise and quiet: gallery, not shop.

## Copy (use verbatim; do not invent headings, claims, prices, quotes or promises)

- Name: Meridian
- Tagline: One line around the earth.
- Intro: A single incised line circles the vessel at the height of a resting hand. Everything else is left to the clay.
- Section — Form: Thrown in three pulls, trimmed at leather-hard, 240 mm tall, 1.9 kg.
- Section — Glaze: Ash and feldspar, reduction fired to cone 10. No two lines land in the same place.
- Section — Studio: Made in a converted signal box beside the railway. Twelve vessels a month.
- Call to action: Reserve a vessel
- Footer: Meridian Studio · studio@meridian.example

## Kit (in ./kit — read kit/README-kit.md)

- `kit/assets/vessel.glb` — the object. Use it in the hero.
- `kit/vendor/three/` — three r182 with GLTFLoader, for local import-map loading.
- `kit/assets/studio.hdr` — listed in the brand kit but NOT delivered. If you reference an
  environment map, the page must render correctly without it.

## Hard requirements (identical for every condition)

1. Output `index.html` (plus any files you create) in the current working directory. It will
   be served over local HTTP. No network requests to any external host — no CDNs, no web
   fonts, no remote images. Only files under this directory.
2. A real-time 3D hero using `kit/assets/vessel.glb`. Scrolling drives the camera and/or
   object through at least three distinct, pinned "chapters" that pair with the Form, Glaze
   and Studio copy.
3. Fallbacks that must be complete, not partial: (a) `prefers-reduced-motion` — no
   scroll-linked movement, content fully readable; (b) JavaScript disabled — all copy readable
   and a static poster in place of the 3D scene (you must make the poster yourself; no
   screenshots are provided); (c) WebGL unavailable or the model/environment failing to
   load — the same poster, no blank hero, no uncaught errors.
4. Usable at 390 px and 1440 px wide: no horizontal overflow, no clipped or overlapping text,
   the copy never obscured by the 3D scene.
5. Use only the copy above. Do not read, fetch or reference anything outside this directory.
