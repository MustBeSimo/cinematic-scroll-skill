# Luxe — quiet-luxury maison (Maison Solenne) · "One day of light"

A worked example for **cinematic-scroll** in a deliberately restrained world:
**quiet luxury** — warm ivory and cognac, a printed-monograph typographic system,
and one idea explored all the way down: **the scroll is the sun.**

A single clock — the hour of day, 06:00 → 19:30 — is derived from scroll depth,
lerped, and every visual state on the page is mixed from it per frame:

- the ground's colour temperature (three fixed "sky" layers — morning, noon,
  dusk — cross-faded by opacity);
- a wash of window light that crosses every photographic plate, with cool
  morning / warm evening tints and a dusk vignette (opacity only);
- the cast shadow under the object — long at dawn and dusk, short and dark at
  noon (`transform: translate + scaleX`);
- the live folio readout (hour · light · Kelvin · page number);
- the sun marker on the west-casement diagram in the Atelier chapter (inline SVG).

Fictional maison (**Maison Solenne**) — no real people or brands.

## The signature moment

**Chapter III · The Object** is a 320vh pinned stage. The card case sits still in
the centre of the viewport while a working day passes over it: the hour numerals
tick from 09:30 to 17:30, the plate cools then warms, the shadow swings from
east to west, and three captions (morning / noon / evening) crossfade in the
same position. The last ~22% of the pin **holds** at 17:30 — a stable viewing
moment — before the page releases into the Atelier specification and the enquiry.

## What it demonstrates

- **Continuous scroll-derived state** (not "chapters that fade in"): one passive
  scroll listener → one rAF loop → `hour = f(scrollY)` via a piecewise-linear
  keyframe table measured from the real section geometry → everything else is a
  pure function of `hour`. Only `transform` and `opacity` mutate per frame.
- **Printed-monograph typography**: folios, plate numbers, a two-column essay
  with drop cap and a column-spanning pull quote (Provenance), a specification
  table and a diagram (Atelier), a centred closing page (Enquire). Every chapter
  has a different grid; nothing repeats a template.
- **Zero dependencies, zero requests beyond the four plates**: system font stacks
  (`Iowan Old Style / Palatino / Georgia`, `system-ui`, `ui-monospace`), fluid
  `clamp()` type, no CDN, no web fonts.
- **Token contract**: the six colour roles (`--bg --surface --fg --fg-dim
  --accent --line`) and the four motion curves (`--ease-reveal|exit|playful|cut`
  from `tokens/motion.tokens.json`) — no literal colours or `cubic-bezier()` in
  declarations. `:hover` is gated behind `@media (hover:hover)`.
- **Complete degradation paths**:
  - **Mobile (< 900px)**: free flow, no pin; the light layers and readouts still
    follow the scroll; the three captions stack in order.
  - **Reduced motion**: no pin, no lerp loop, no reveals; the page rests at
    13:00 with every state composed and readable.
  - **No JS**: identical content in flow; plates at their noon defaults; the
    captions listed; readouts at their static defaults.
- **Accessibility**: one `h1`, ordered headings, descriptive `alt` on all four
  plates, `:focus-visible`, keyboard-reachable CTA (`mailto:`), decorative
  layers `aria-hidden`, the SVG diagram titled and described.

## Run it

```bash
# from the repo root
python3 -m http.server 8099
# then open http://localhost:8099/examples/luxe/
```

Single self-contained `index.html` plus four JPEG plates in `assets/`.
Double-click works too (the plates are plain `<img>`, no JS-fetched assets).

## Image slots

| Slot | File | Where it appears |
|------|------|------------------|
| Plate I | `assets/overture.jpg` | Frontispiece (4:5) |
| Plate II | `assets/provenance.jpg` | Provenance (square crop) |
| Plate III | `assets/object.jpg` | The Object — the pinned day (4:5) |
| Plate IV | `assets/audience.jpg` | Atelier (21:9 crop, bottom-anchored) |

The light layers (`.wash`, `.tint.cool`, `.tint.warm`, `.dusk`) are stacked on
every `.plate`; swap the JPEGs and the page re-lights them automatically.

## Editing

- **Copy and captions** live directly in the markup (it is a monograph, not a
  manifest).
- **The day**: `H0`/`H1` and the `keys` table in `measure()` map scroll positions
  to hours per section; `render(h)` is the single place where hour → visual
  state is defined (tints, wash position, shadow length, Kelvin, notes).
- **Captions in Chapter III**: `data-from` / `data-to` on each `.cap` are the hour
  ranges that switch them.
