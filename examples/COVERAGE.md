# Catalogue Coverage

An honest map of what the skill demonstrates: **visual systems**, **scroll patterns**, and the
two kinds of reference build — the token-driven **component library** (`components/`) and the
older **example sites** (`examples/`). No faked coverage; gaps are marked.

## Visual systems (11)

Every system is a machine-readable theme in `themes/<slug>.theme.json` (validated by
`npm run themes:check`). "Example" notes the nearest demo site where one exists.

| System | Theme file | Nearest example site |
|--------|-----------|----------------------|
| Symmetric Monument | ✅ `themes/symmetric-monument.theme.json` | ~ luxe (quiet-luxury) |
| Clinical Noir | ✅ `themes/clinical-noir.theme.json` | ~ noir ("Signal Clear" — non-canonical) |
| Storybook Geometry | ✅ `themes/storybook-geometry.theme.json` | ~ pop (BLOOM) |
| Temporal Monument | ✅ `themes/temporal-monument.theme.json` | flagship (× Atmospheric Sublime) |
| Atmospheric Sublime | ✅ `themes/atmospheric-sublime.theme.json` | flagship, immersive |
| Warm Scrapbook | ✅ `themes/warm-scrapbook.theme.json` | ~ wellness |
| Naturalistic Drift | ✅ `themes/naturalistic-drift.theme.json` | ~ renaissance |
| Brutalist Kinetic *(new)* | ✅ `themes/brutalist-kinetic.theme.json` | studio (brutalist portfolio) |
| Liquid Chrome *(new)* | ✅ `themes/liquid-chrome.theme.json` | — (theme ready) |
| Botanical Editorial *(new)* | ✅ `themes/botanical-editorial.theme.json` | — (theme ready) |
| Data Cinematic *(new)* | ✅ `themes/data-cinematic.theme.json` | — (theme ready) |

## Component library (9) — the token-driven reference

These are the canonical, doctor-verified (≥96) demonstrations of the contract — token-driven,
both modes, degrade contracts inline. See `references/component-grammar.md` + `components/manifest.json`.

`PinnedReveal · HeroParallax · DepthFigure · TiltCard · MorphBackground · HorizontalGallery · ScrubVideo · KineticHeadline · MagneticCursor`

## Scroll patterns (12)

Documented in `references/scroll-patterns.md` (§1–12): Pinned Hero, Scrubbed Timeline,
Velocity-Reactive, Sticky Narrative, Chaptered Release, Parallax Gallery, 3D Product Orbit,
Editorial Longread, Data Story, Landing Sequence, Portfolio Reveal, Archive Explorer.
The component library demonstrates several directly (HeroParallax, ScrubVideo, HorizontalGallery,
PinnedReveal, KineticHeadline).

## Token status of the example sites (incremental refactor target)

The `examples/` sites predate the token contract: they pass the doctor (81–99) but score low on
the new `tokens` category because they define bespoke `:root` palettes with literal hex in
declarations rather than referencing role vars. Lifting them onto the contract is incremental —
the token-driven path is already proven by the 9 components.

| Example | doctor | tokens | system (approx) |
|---------|:---:|:---:|-----------------|
| atelier | 99 | 94 | awwwards techniques showcase |
| flagship | 96 | 66 | Atmospheric Sublime × Temporal Monument |
| immersive | 97 | 70 | Atmospheric Sublime (3D) |
| renaissance | 85 | 64 | Naturalistic Drift / editorial |
| wellness | 84 | 58 | Warm Scrapbook |
| luxe | 84 | 58 | Symmetric Monument (quiet luxury) |
| noir | 83 | 46 | Clinical Noir ("Signal Clear") |
| studio | 83 | 42 | Brutalist Kinetic |
| pop | 85 | 34 | Storybook Geometry (Gen-Z) |
| retro | 81 | 34 | retro |

### Scoped follow-on (not done here)

- Refactor each example's `:root` to consume `tokens/build/*.vars.css` role vars (raises `tokens`).
- Rename `examples/noir` → `examples/signal` to match its actual "Signal Clear" content, and add a
  canonical **Clinical Noir** example.
- Add demonstrator examples for the 4 net-new systems (Liquid Chrome, Botanical Editorial, Data
  Cinematic) and the under-shown patterns (Data Story, Archive Explorer, Editorial Longread).

These are tracked as incremental polish; the contract, themes, and component library that they'd
build on are complete and gated.
