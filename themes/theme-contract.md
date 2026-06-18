# Theme Contract

A **theme** is a per-visual-system overlay on `tokens/semantic.tokens.json`. It re-voices the
cross-system role contract with one system's palette, type, and signature motion — so picking a
look is one file, not a rewrite. Themes are validated by `npm run themes:check` and built to
per-system CSS by `npm run build:themes`.

Each theme corresponds to a system in [`references/film-archetypes.md`](../references/film-archetypes.md).

## Required keys

Every `themes/<system>.theme.json` **must** define, under `semantic`:

| Group | Keys | Notes |
|-------|------|-------|
| `color` | `bg`, `surface`, `fg`, `fg-dim`, `accent`, `line` | hex (or alias for `line`); `fg` must clear WCAG AA on `bg`; exactly **one** `accent` |
| `font` | `display`, `body`, `ui` | alias a `core.font.*` stack (≤2 distinct families per the §4.8 rule) |

## Optional (re-voice motion / type)

| Group | Keys | Why |
|-------|------|-----|
| `ease` | `reveal`, `exit`, `playful`, `cut` | give the system its signature curve (carry the GSAP name in `$extensions["skill.cinematic-scroll"].gsap` for Mode B). Unset roles inherit the canonical four. |
| `type` | `title`, `subtitle`, `body`, … | scale specialization (e.g. monumental display). Inherits defaults if unset. |

Anything not overridden inherits the neutral-editorial default from `semantic.tokens.json`.

## Metadata

Carry system facts under top-level `$extensions["skill.cinematic-scroll"]`: `system` (display
name), `archetype` (link), `depth-layers`, `pin-vh` ([min,max]) — these feed the doctor and the
gallery.

## Build / verify

```bash
npm run themes:check                                       # every theme fills the contract + resolves
node tools/build-tokens/build.mjs --theme themes/clinical-noir.theme.json   # → tokens/build/clinical-noir.vars.css
npm run build:themes                                       # build all
```
