# Vantascope — "Signal Clear" redesign

A clean **sci-fi editorial** worked example for **cinematic-scroll** (archetype A5, redesigned 2026).
Aesthetic: warm-white canvas, massive **Oswald** headlines in near-black, **crimson** as the single
signal accent. Open negative space, architectural grid, **no grain**. A "signal clear" studio —
the opposite of the old heavy noir look. Same cinematic scroll engine, completely fresh visual system.

Between the hero and the descent sits **"The Approach"** — a GSAP ScrollTrigger beat showcasing a
**dolly-zoom** (Vertigo — the backdrop pushes in while the caption holds) and a **scrubbed signal draw**
(a crimson waveform draws across the frame via `stroke-dashoffset` as you scroll).

Visual system: **Signal Clear** — clean, architectural, editorial. Light canvas; every chapter morphs
to a distinct subtle gradient (electric-blue tint → signal-red tint) keeping the progression readable.

Single self-contained `index.html` — no build step, no npm. The hand-rolled rAF cinematic engine has
**zero JS dependencies**; the one "Approach" beat additionally loads **GSAP + ScrollTrigger** from a CDN
(deferred, feature-detected). Only other external resource: Google Fonts. GitHub-Pages-native.

- **4 chapters** (Signal · Descent · Witness · Access) + a **GSAP "Approach" showcase beat**
- **Palette:** warm white `#F5F4F0`, near-black `#0A0B0F`, crimson signal `#E23A4E`, electric blue `#1044F2`
- **Type:** Oswald (condensed display), Archivo (UI), JetBrains Mono (labels)

## Run it / preview

```bash
python3 -m http.server 8099    # then open http://localhost:8099/examples/noir/
# …or just open index.html directly in a browser.
```

Deploys as-is to GitHub Pages at
`https://mustbesimo.github.io/cinematic-scroll-skill/examples/noir/` — all paths are relative.

## Works with ZERO images

The page renders a complete, intentional **CSS-only placeholder** for every still —
a geometric grid with a clean light-to-blue-grey gradient and a crimson signal rim on the right edge.
On load it probes for a real `assets/<id>.jpg`; if the file 404s, the placeholder is used.
Drop real images into `assets/` later and the page picks them up automatically — no code change.

## Image slots

Generate these as **clean cinematic sci-fi editorial stills**: warm-white or neutral backgrounds,
architectural geometry, a single crimson signal-line accent, ultra minimal, no grain.
**No baked-in text or logos** (the page supplies all type).

| Slot (probed path)      | Aspect | Target px   | Generation prompt |
|-------------------------|:------:|:-----------:|-------------------|
| `assets/0-signal.jpg`   | 4 : 5  | 1024 × 1280 | Cinematic sci-fi editorial still: a lone figure in a long coat seen from behind, standing on a vast white-marble floor, geometric light shafts from above, open architectural space, one thin **crimson** line of light along the right edge, ultra clean, no grain, no text, no logos, 4:5 |
| `assets/1-descent.jpg`  | 4 : 5  | 1024 × 1280 | Cinematic sci-fi editorial still: a long brutalist corridor, concrete walls, geometric shafts of white overhead light, a single thin **crimson** line along the right wall, a silhouetted figure small at the far end, ultra minimal, no grain, no text, no logos, 4:5 |
| `assets/2-witness.jpg`  | 4 : 5  | 1024 × 1280 | Cinematic sci-fi editorial still: extreme close portrait, face half-lit by clean white light, one side in cool neutral shadow, a thin **crimson** signal-line along the jaw, ultra clean, architectural background, no grain, no text, no logos, 4:5 |
| `assets/3-access.jpg`   | 4 : 5  | 1024 × 1280 | Cinematic sci-fi editorial still: a clean white threshold doorway, blinding white light pouring through, a silhouetted figure in the threshold, one thin **crimson** line along the right edge, open negative space, no grain, no text, no logos, 4:5 |

> The prompts live verbatim in the `CHAPTERS` manifest inside `index.html` (`prompt` field).
> Keep every still **text-free / logo-free**; all titles, the signal CTA, and labels are drawn by the page.

## Accessibility & performance

- Semantic landmarks (`header` / `nav` / `main` / `footer`), `aria-label`s, each still
  exposed as `role="img"` with a descriptive label.
- **Compositor-only** scroll: the rAF-batched loop mutates only `transform` / `opacity`; passive scroll listener; 3D only for in-view sections.
- **Mobile (≤680px)** drops the pin and 3D camera but keeps touch-safe scroll-coupled motion.
- **Reduced-motion** renders a clean static mid-state — full opacity, no motion.
