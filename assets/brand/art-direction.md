# Web Design Studio — the maker and the medium

User direction, 2026-09-11: Renaissance/classical imagery, fluorescent accents and
interactive navigation, informed by https://contralabs.com/. This is the product
identity, not a mandatory style for websites made with the skill.

An artist's studio connects the craft of making an architectural model to making
an explorable website. The original fal.ai painting carries the human gesture;
the next frame is the working Aureus scene. The visitor moves from the model to
the built world through native scrolling and linked, playing website previews.

Motifs: architectural frames, numbered studies, an acid-chartreuse signal and
underlined serif titles. Cool paper and charcoal support the warm painted figure.
Chartreuse marks actions and interaction; it is not body-text colour on paper.
Cormorant Garamond carries expressive headings; Space Grotesk carries controls.

| Beat | Start → change → hold → exit | Static / mobile |
|---|---|---|
| Maker | Full-width living painting → opening holds for 20% of the desktop sequence → arch grows from the model → Aureus fills the frame at 70% | Painting and copy blend in normal flow; motion stops under reduced motion |
| Medium | Existing Aureus recording through a fixed SVG arch → full scene holds for the final 30% → Enter Aureus → collection | Separate linked film in normal flow; poster under reduced motion |
| Collection | Open Explore → visual destinations respond to focus/hover → choose one of two galleries → anchor closes menu | Native details, Escape/focus exit, links without JS |
| Make | Inspect a project → copy its prompt → install the free skill | Same content and actions in flow |

Hero verdict: the painted architectural model opens into a working website.
The fixed SVG arch scales while the recording counter-scales, so the existing
runtime animates only transforms and opacity. The artwork is a painting, not a
claim of real 3D. The portal uses no renderer, scroll interception or second animation clock.

The sticky sequence is limited to widths above 1024px with a fine pointer and
normal motion. Native scroll adds clamp(480px,80vh,800px) plus a 240px entry buffer;
the buffer slows only the first 45% of progress, keeping the later reveal and
ordinary page scrolling at their previous pace. Reversing scroll reverses
the reveal. Touch, reduced motion, paused motion and no JavaScript keep both scenes
in document flow. Masked controls leave the tab order. Header installation stays
available throughout. Homepage layout has one canonical stylesheet,
`studio-brand.css`, after the shared gallery motion primitives.

`renaissance-studio.jpg`: original fal.ai FLUX.2 Pro generation, 1536×1024;
prompt, seed and generation date in `source.json`. Right-weighted focal crop,
high-priority hero. No reference artwork was copied. Gallery recordings retain
their original sources. Navigation text and the wordmark are live HTML.

No repository, package, install identifier or example route changes. Aureus and
the other example websites retain their own art direction. The optional provider
key stays local and is never included in exported assets.

## Living artwork and integration picker — 2026-09-11

User requested animation within the hero artwork and animated stickers across
the gallery. `renaissance-h3-15s.mp4` is a 15-second fal.ai MiniMax H3 Max
image-to-video study, generated with the original painting as both starting and
ending image. `motion-source.json` preserves the prompt and model. The locally
encoded H.264 export is silent, loops only while visible, and preserves the
painting when decoding fails or reduced motion is requested.

`renaissance-h3-15s-mobile.mp4` is the same 15-second film at 720×480, H.264
CRF 26, silent, with fast-start metadata (about 0.8 MB versus 6.8 MB desktop).
The viewport/pointer choice happens once before assigning a source; resizing does
not download a second encode. Background tabs and offscreen media suspend.

Three linked stickers share the gallery runtime and stop offscreen, when paused,
or under reduced motion. Motion starts automatically when visible. The redundant
button over the painting was removed at the user's request; the existing control
below the hero pauses both the artwork and gallery previews.
The install selector offers peer options for Claude Code, Cursor, Hermes, Kimi
Code, Gemini CLI, OpenClaw and other agents, with documented installer identifiers
in `INTEGRATIONS.md`. Browser tests verify command selection and motion lifecycle;
they do not claim native installations in every agent.

## Restored torus background and navigation — 2026-09-11

At the user's request, the circular particle-tunnel flight from e074e6d returns
behind the collections. `studio-tunnel.mjs` reconstructs the same major-radius
60 / tube-radius 15 geometry with seeded points, a camera following the circular
centreline, gentle idle drift and pointer steering. Scroll drives one lap.
It uses one local WebGL point draw through the existing gallery clock, with no
Three.js/CDN dependency: 4,800 points desktop, 1,800 touch/low quality, DPR ≤1.5.
Paper/charcoal and chartreuse replace the old gold/teal colours. The painting
covers the opening; the tunnel appears when the collections enter view.

Reduced motion, pause, hidden tabs and the covered opening suspend rendering.
No WebGL, compile failure or context loss leaves the existing readable paper
composition; context restoration rebuilds resources. The tunnel is decoration,
not a content dependency. Pointer events pass through it.

Explore closes before explicitly scrolling and focusing the chosen section below
the header. It restores a collection hidden by search, preserves native fragment
history and leaves modified clicks alone. Unknown focus destinations cannot close
the menu before a pending link click completes.
