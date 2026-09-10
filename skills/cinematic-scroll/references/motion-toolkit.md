# Motion toolkit

Choose a response that makes the subject clearer. Richness comes from precise
cause and effect, not from applying every effect to every section.

## One shared signal layer

Sample scroll progress/velocity/direction, pointer coordinates/velocity, target
proximity and page visibility in one owned clock. Read geometry before writing
styles. Cache ordinary flow geometry and refresh after font, asset or layout
changes; pinned/transformed targets need refreshed coordinates. Each animated
property has one owner. Use wrappers to separate entrance, parallax and tilt.

Normalize scroll progress to 0–1 and pointer axes to −1–1. Measure proximity from
the edges of the full target rectangle, with a bounded smooth falloff. The actual
link/button hit area stays still while an inner decorative surface moves.
Only hover-capable fine pointers receive tilt/magnetism; focus never tilts.

## Text vocabulary

- Line masks reveal thought units; re-split after fonts or wrapping change.
- Word cascades pace a short statement without delaying the primary action.
- Character waves use graphemes, not UTF-16 code units, on short display text.
- Velocity skew expresses momentum with a small bounded transform.
- Scramble is a brief reveal with a stable accessible name, not a random loop.
- Variable-axis emphasis requires an actual variable font and a bounded reveal.

Keep original semantic text selectable and readable without scripts. Restore
original nodes on teardown. Do not split links, controls or editable text. Use
GSAP SplitText autoSplit/onSplit when that installed dependency suits the app;
otherwise use scoped DOM splitting. Do not continuously animate letter spacing.
Transform a wrapper, or crossfade background layers by opacity instead of
continuously repainting background colors.

## Shader and renderer vocabulary

Displacement gives local pressure; refraction creates a lens; atmosphere gives
an evolving field of light; a portal reveals another view. Preserve a useful
poster behind each. Bound displacement and avoid flashing or body-copy distortion.
Custom materials need a deliberate color-space/tone-mapping pipeline, not two
output conversions. Share one renderer where practical and dispose owned GPU
resources without destroying shared caches.

Prefer the compatible WebGL2/R3F path for standard work. Treat WebGPU/TSL as a
separate experimental implementation with its own materials, automatic WebGL2
fallback, and no assumed compatibility with legacy shader/postprocessing/XR code.
An XR session owns its camera and starts only after an explicit visitor action.

## Responsive quality

Start balanced, then respond to measured active frames. Suggested DPR caps are
1.5 high, 1.25 balanced and 1 low. Reduce particles, shadow maps and postprocessing
with the tier; do not merely change a label. Two slow one-second windows can
downgrade; five stable seconds can upgrade. Lock low after repeated reversals.
Ignore idle/background time in these samples. Offscreen and settled effects sleep.
Static mode restores the DOM composition: no pin, tilt, split hiding or GPU loop.
Provide a pause control for sustained motion and react to live reduced motion.

## Reuse and proof

When the full Cinematic Scroll repository is already supplied, its MIT `runtime/`
contains these reusable primitives and its Next template contains React/Three
adapters. The text-only ClawHub package does not contain executable runtime code;
do not claim those files are installed here. Use the existing project's tools,
or obtain the full source only when the user requests that workflow.

Verify actual scene changes from controls, shader pixels, reverse scroll, resize,
keyboard access, mobile, reduced motion, no JS, no WebGL, context recovery and
teardown. A clean console is not visual review. Emulation and software rendering
do not establish hardware frame rate, battery performance or Safari coverage.
