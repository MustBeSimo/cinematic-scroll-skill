# Design Tokens — Reference

The machine-readable half of the [design contract](../design.md). If `design.md` is the map,
this is the legend: how the token files are structured, the conventions they follow, and how to
extend them. The human-facing tables live in `design.md`; this file is for anyone touching the
JSON or the emitters.

## Files

| File | Layer | Holds |
|------|-------|-------|
| `tokens/core.tokens.json` | primitive | brand-agnostic raw values: neutral ramp, default brand accents, 8px space scale, radii, type sizes, font fallback stacks, breakpoints, z-index |
| `tokens/motion.tokens.json` | primitive | the 4 signature easing curves (taste-guardrails §4.1), duration scale, pacing constants (§3), stagger, depth multipliers |
| `tokens/semantic.tokens.json` | semantic | the **role contract** — `bg/surface/fg/fg-dim/accent/line`, `font.{display,body,ui}`, `ease.{reveal,exit,playful,cut}`, durations, type & space roles. Default = neutral editorial; themes override. |
| `themes/*.theme.json` *(Phase 3)* | theme | per-visual-system overrides of the semantic role set |

## Format

W3C **Design Tokens Community Group** (DTCG): every token is `{ "$value": …, "$type": … }`,
nested in groups. `$type` may be declared once on a group and is inherited by descendants.

Value encodings used here (chosen for Style-Dictionary-v4 + zero-dependency validation):

| `$type` | Encoding | Example |
|---------|----------|---------|
| `color` | hex string (6 or 8 digit) | `"#C9A96E"`, `"#16131024"` |
| `dimension` | `{ value, unit }` (`px`\|`rem`) | `{ "value": 16, "unit": "px" }` |
| `duration` | `{ value, unit }` (`ms`\|`s`) | `{ "value": 500, "unit": "ms" }` |
| `cubicBezier` | `[x1,y1,x2,y2]` | `[0.16, 1, 0.3, 1]` |
| `number` | bare number | `0.5` |
| `fontFamily` | array of strings | `["Inter","system-ui","sans-serif"]` |

## Aliases

Reference another token by its dot-path in braces — the **only** way to reuse a value:

```json
"accent": { "$value": "{core.color.brand.amber}" }
"reveal": { "$value": "{motion.ease.reveal}" }
```

Aliases resolve transitively; cycles and dangling refs fail `tools/check-tokens.mjs`.

## Emit convention (Phase 2)

- **Semantic** tokens emit **terse** CSS vars (drop the `semantic.` prefix): `--bg`, `--accent`,
  `--ease-reveal`, `--ease-cut`, `--dur-title`. This is what components and chapters reference
  (the whole `--ease-*` role set is semantic, even though the curves live in `motion.tokens.json`).
- **Core / motion** primitives emit **namespaced** vars: `--space-md`, `--size-h1`,
  `--radius-lg`, `--depth-mid`, `--pacing-pin-min-vh`.
- GSAP names for Mode B live under each easing's `$extensions["skill.cinematic-scroll"].gsap`.

## Extending

- **New theme** → add `themes/<system>.theme.json` defining every key in the semantic role set
  (the theme-contract in Phase 3 enumerates them). Ground its palette/ease in the matching
  system in [`film-archetypes.md`](./film-archetypes.md).
- **New primitive** → add to `core`/`motion`; alias it from `semantic` so components can reach it.
- After any edit: `node tools/check-tokens.mjs` (also wired as `npm run tokens:check`).

## Verify

```
node tools/check-tokens.mjs      # parses, resolves every alias, checks required roles + canonical easings
```

Exit 0 = contract is sound. This is the Phase 1 gate and a CI invariant (Phase 12).
