# Vantascope — "Hollow Star"

An **editorial sci-fi release page** for **cinematic-scroll** (archetype A5, rebuilt 2026-09).
A fictional studio, VANTASCOPE, announces *Hollow Star* — a film about a signal that calls
one person back — across four transmissions.

## The one idea

**The page is a receiver. Scroll is the gain knob.**

A fixed, procedural **spectrogram waterfall** (`<canvas>`, ~36k cells per frame drawn from a
seeded noise buffer) fills the viewport. At the top of the page it is pure hiss. As you scroll,
a single crimson **carrier climbs out of the noise floor**: it wanders and sharpens (Trace →
Carrier), starts to pulse an on–off cadence — three long, two short — (Cadence), and finally the
noise collapses and it **locks**. The waterfall is deterministic in scroll position: reverse
scrolling rewinds it exactly, and nothing moves while you are not scrolling.

Every HUD readout is computed from the same scroll-derived gain value each frame:

| Readout | Range | Where |
|---|---|---|
| SNR | −2.4 → 42.4 dB | top-right, large |
| Noise floor | −96 → −118 dBm | top-right |
| Carrier | 1420.7xx → 1420.405 MHz (drift settles on the hydrogen line) | top-right |
| Status | Noise floor · Trace · Carrier · Cadence · Lock | top-right |
| Spectrum | live line plot of the newest waterfall row | top-right, under the readout |
| Gain rail | marker on a tick rail (Noise / Trace / Carrier / Cadence / Lock) | left edge |

World colours (`--world-a`, `--world-b`, `--lock`) are mixed per frame from gain as well —
teal-black at the noise floor, crimson-black vignette at lock.

Each chapter `<section>` owns a gain range (`data-g0` / `data-g1`), so the receiver state
always matches the chapter you are reading regardless of viewport height.

## Composition

Desktop chapters are a triptych: **evidence plate · live carrier · story panel**, alternating
sides so the carrier at 50% is never covered. The four plates in `assets/` are the real
imagery; the panels carry the story, mono "facts" rows, and — in Transmission IV — the primary
action (**Request early access**). Release details (premiere, runtime, format) are readable in
the hero and repeated in the final chapter. Fixed top/bottom scrims let scrolling content fade
under the masthead and HUD instead of colliding with them.

Type is system stacks only: a heavy sans display (`system-ui` / Helvetica Neue), an editorial
serif for ledes (`Iowan Old Style` / Palatino), and `ui-monospace` for the instrument.

## Single file, zero dependencies

`index.html` + `assets/*.jpg`. No fonts, no CDN, no GSAP. Motion is one rAF scroll clock with
a `lerp` toward the scroll-derived target; the loop stops when settled. Only `transform`,
`opacity` and canvas pixels change per frame. Colour roles and the four signature easings are
`:root` tokens (`--bg --surface --fg --fg-dim --accent --line`, `--ease-reveal|exit|playful|cut`).

- **Mobile (≤760px):** free-flow single column (plate, then panel), 4px waterfall cells,
  readout beside the brand, meter/scope hidden, shorter reveal rises.
- **Reduced motion:** the waterfall is painted once in its locked state, readouts still track
  position, all reveals are static and visible, the hint loop is off.
- **No JS:** a CSS noise-grid ground with a static carrier band, initial HUD values in markup,
  all copy and plates in flow.

## Run it

```bash
python3 -m http.server 8099    # then open http://localhost:8099/examples/noir/
# …or open index.html directly — everything is inline.
```

## Image slots

All four plates exist. If you regenerate them, keep them **text-free / logo-free**, 4:5,
1024 × 1280, teal-dark with one crimson accent:

| Path | Subject |
|---|---|
| `assets/0-signal.jpg` | industrial corridor, lone figure walking toward a single red lamp |
| `assets/1-descent.jpg` | hooded figure descending a wet concrete stairwell |
| `assets/2-witness.jpg` | sealed helmet and armoured suit, edge-lit in red, rain and fog |
| `assets/3-access.jpg` | small figure before a towering gate filled with luminous mist |

## Accessibility

One `h1`, headings in order, `header` / `nav` / `main` / `footer` landmarks, descriptive `alt`
on every plate, `aria-hidden` on canvases and decorative HUD, visible `:focus-visible` rings,
the primary action is a plain keyboard-reachable link.
