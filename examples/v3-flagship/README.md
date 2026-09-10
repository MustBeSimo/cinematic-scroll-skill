# FIELD — there is more to looking

A fictional optical study: open a six-blade iris to reveal more of one drawn
contour landscape. Scroll changes the landscape's orientation within the frame.
The aperture stays under the visitor's control. This is an expressive illustration,
not a simulation of lens physics.

## Open and edit

Open `index.html` directly, or serve the repository:

```bash
python3 -m http.server 8875 --bind 127.0.0.1
# http://127.0.0.1:8875/examples/v3-flagship/
```

Edit `page.template` (story and SVG), `story.css` (composition), and `story.mjs`
(interaction). From the repository root, run `npm run build:flagship` to update the
portable HTML; `npm run check:flagship` detects stale exports. The editorial palette and styles are owned by `story.css`; shared lifecycle/signals
come from `runtime/`.
The generated HTML bundles these dependencies. Google Fonts is optional and the
local serif/sans fallback keeps the page readable.

## What to learn from this example

- **Orientation:** the instrument appears alongside the first story beat, with a
  compact introduction and a native aperture slider.
- **Reveal:** SVG masking exposes more of the same contours. The result changes
  inside the scene, not only in a readout. Home/End inspect the range; Reset returns
  the aperture to 45% without changing the motion preference or scroll position.
- **Reframe:** one shared scroll clock rotates the terrain. Reverse scroll retraces
  it. There is no intercepted scrolling or extra animation loop.
- **Static interaction:** pause and reduced motion stop scroll-linked movement;
  explicit aperture input still works. Pause preserves the page's layout.
- **Fallback:** no WebGL is required. Without JavaScript the authored 45% opening,
  story and links remain visible; inactive controls are hidden. Mobile uses flow.

All graphics are authored SVG, distributed under MIT. No generated images, model
assets, credentials, or paid service are needed. The Next.js `/v3-flagship` route
remains a separate Three.js interpretation; it does not yet share this iris redesign.

## Verification — 2026-09-10

```bash
node --test examples/v3-flagship/interaction.test.mjs
node tools/page-proof/matrix.mjs examples/v3-flagship/index.html --out .verify/field
```

The interaction regression checks actual scene changes, keyboard endpoints, reset,
pause, live reduced motion, unavailable WebGL, no-JS fallback, system color changes,
and overflow at 320/390/768/1440px. Browser matrices cover desktop, mobile, reduced
motion, mobile reduced motion, and no JS. Inspect their screenshots before making
visual claims. Automated Chromium is not physical Safari or a GPU benchmark.

On 2026-09-10, the redesigned standalone page was scored against the pinned brand
grammar through an authorized temporary preview: **0.70 / 0.75 required — FAIL**.
Findings: heading weight, sentence length, whitespace density, and dark-mode
detection. The dark-mode finding conflicts with the passing live system-color
browser check; it does not override the failed external result. The judge reported
18 measured axes, two recovered axes, and no visual axes. The page is not fully
brand-verified. Full report: `.verify/field-improvement/taste-score.json` in the
repository's local evidence directory. The public tunnel and staging server were
closed immediately after scoring.

## Editorial restoration

The user rejected the violet treatment on 2026-09-10. FIELD and the main index now
use the earlier Cormorant/Space Grotesk pairing, paper/charcoal surfaces and restrained
brass accents. The index preserves the example collection and presents FIELD as a
small workshop link. This is the project's current art direction; do not reintroduce
purple gradients or glow to chase the older external brand target. The 0.70 report
above belongs to the superseded violet design, not this revision. Browser matrices
and the iris interaction regression pass; the restored design has not been externally
scored. Evidence is in `.verify/editorial-restore/`.
