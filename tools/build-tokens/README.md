# build-tokens

Zero-dependency DTCG → CSS/TS emitter. Reads `tokens/*.tokens.json`, resolves every alias,
and writes the artifacts that Mode A and Mode B consume.

```bash
npm run build:tokens                                   # default (neutral-editorial) theme
node tools/build-tokens/build.mjs --theme themes/clinical-noir.theme.json   # per-system (Phase 3)
```

## Outputs (`tokens/build/`)

| File | For | Contents |
|------|-----|----------|
| `variables.css` | Mode A + Mode B | `:root { … }` custom properties — committed so Mode A stays **zero-build** (inline the block, no toolchain) |
| `<theme>.vars.css` | both | per-visual-system variable block (when `--theme` is passed) |
| `tokens.ts` | Mode B | `cssVars` (typed map), `gsapEase` (CSS-var → GSAP ease name), and a `v('--token')` helper |

## Naming (must match `design.md`)

- **Semantic** → terse role vars: `--bg`, `--accent`, `--fg-dim`, `--font-display`, `--ease-reveal`, `--dur-title`, `--gutter`.
- **Core** → namespaced: `--space-md`, `--size-h1`, `--radius-lg`, `--neutral-500`, `--brand-amber`, `--bp-md`, `--z-modal`.
- **Motion** → `--pacing-pin-min-vh`, `--depth-mid`, `--stagger-base`; `motion.ease.*` is skipped (surfaced via the semantic `--ease-*` set to avoid duplicate vars).
- **Fluid** → `--fluid-h2/h1/display/display-xl` via `clamp()` interpolated 360→1280px.

## Guarantees

- **Deterministic** — same input → byte-identical output (the gate re-runs and diffs).
- **Fail-loud** — a dangling alias or cycle exits non-zero (never emits half a file).
- Run `npm run tokens:check` first; this build assumes a valid contract.
