---
title: Web Design Studio — Design Contract
tokens: ./tokens/
version: 1.0.0
status: foundation (Phase 1)
audience: build agents (Mode A single-file + Mode B Next.js) and human reviewers
---

# Design Contract

This is the single source of truth an agent reads **before emitting any CSS/TS**. It turns
"taste" into a contract: concrete tokens, named motion, a banned-pattern list, and a
component grammar. Do not improvise hex codes, type scales, easing curves, or pin ranges —
reference a token. The machine-readable values live in [`tokens/`](./tokens/) (W3C DTCG
`$value`/`$type`); this file is the readable map of them.

> **Determinism rule.** Two builds of the same visual system must look the same. If you find
> yourself typing a literal `#hex`, `cubic-bezier(...)`, or a bare `vh` pin height, stop —
> there is a token for it. The `cinematic-doctor` token-conformance check (Phase 8) fails the
> build on untraceable literals.

---

## 1. How tokens reach your code

| Layer | File | Emits as | You write |
|-------|------|----------|-----------|
| **Semantic roles** | `tokens/semantic.tokens.json` | terse role vars | `var(--bg)`, `var(--accent)`, `var(--ease-reveal)`, `var(--dur-title)` |
| **Core primitives** | `tokens/core.tokens.json` | namespaced vars | `var(--space-md)`, `var(--size-h1)`, `var(--radius-lg)` |
| **Motion primitives** | `tokens/motion.tokens.json` | namespaced vars | `var(--depth-mid)`, `var(--pacing-pin-min-vh)`, `var(--stagger-base)` |

Components and chapters reference **semantic roles only** (`--bg`, `--fg`, `--accent`, the
`--ease-*` set). A visual-system swap then changes one theme file, not your markup. Reach for
a core primitive directly only for layout rhythm (`--space-*`) or discrete type sizes.

The terse↔namespaced split and the per-theme `.vars.css` files are emitted by the Phase 2
build pipeline (Style Dictionary v4). Mode A inlines the relevant `:root` block (zero build);
Mode B imports the generated CSS + typed TS.

---

## 2. Color roles

Every theme **must** define all six roles (enforced by `tools/check-tokens.mjs`). Defaults
shown are the neutral-editorial theme; per-system values live in `themes/*.theme.json`.

| Role | Var | Default | Usage |
|------|-----|---------|-------|
| Background | `--bg` | `#F7F5F1` | Page / chapter ground |
| Surface | `--surface` | `#EFEBE4` | Panels, cards, caption grounds |
| Foreground | `--fg` | `#161310` | Primary text — must clear WCAG AA on `--bg` |
| Dim foreground | `--fg-dim` | `#574F45` | Labels, captions, secondary copy |
| Accent | `--accent` | `#C9A96E` | The **single** restrained accent — interactive + narrative punctuation |
| Line | `--line` | `#16131024` | Hairlines, rules, dividers |

Rules: **one** accent per system (taste-guardrails §1 / film-archetypes). Alternate palette
*temperature* across chapters — never warm→warm→warm (§4.6). Color is punctuation, not
decoration.

---

## 3. Type scale

Families (`--font-display`, `--font-body`, `--font-ui`) and a major-third (1.25) size scale.
Max **2** families per chapter (§4.8); a third must be a weight/style of an existing family.

| Token | rem | Role |
|-------|-----|------|
| `--size-caption` | 0.78 | eyebrows, metadata |
| `--size-body` | 1.0 | base copy |
| `--size-body-lg` | 1.125 | lead copy |
| `--size-h4`…`--size-h1` | 1.953 → 3.815 | subheads → titles |
| `--size-display` / `--size-display-xl` | 5.96 / 7.45 | monumental headlines |

Line-height: `--type-lh-display` (1.1) for display, `--type-lh-body` (1.7) for copy — §4.8 minimums are 1.1 display / 1.5 body (core ramp `--lh-tight`…`--lh-loose` is also available). Tracking tokens: `--tracking-tight`
(confident sans titles) → `--tracking-widest` (monumental caps).

---

## 4. Spacing, radii, layout

- **Spacing**: 8px scale, `--space-3xs` (2) … `--space-5xl` (128). Use for padding/gap/rhythm; never raw px.
- **Radii**: `--radius-none` … `--radius-full` (4/8/16/24/9999).
- **Breakpoints**: `--breakpoint-sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280.
- **Z-index**: `--z-base` 0 / `raised` 10 / `sticky` 100 / `overlay` 1000 / `modal` 10000.

---

## 5. Motion (the soul)

Default CSS easings (`ease`, `ease-in-out`, `linear`) are **banned** (§4.1). Reference a role:

| Var | Curve | Feel | Use |
|-----|-------|------|-----|
| `--ease-reveal` | `cubic-bezier(.16,1,.3,1)` | dramatic deceleration | hero/title entrances |
| `--ease-exit` | `cubic-bezier(.7,0,.84,0)` | clean acceleration | chapter exits |
| `--ease-playful` | `cubic-bezier(.34,1.56,.64,1)` | overshoot | micro-interactions |
| `--ease-cut` | `cubic-bezier(.87,0,.13,1)` | heavy, deliberate | scene transitions |

**Durations** (timed, not scroll-scrubbed): `--dur-instant` 120ms · `--dur-fast` 300 · `--dur-base` 500 · `--dur-slow` 720 · `--dur-glacial` 1200.

**Pacing** (scroll, from §3 — these are the *budget*, read by the doctor):

| Token | Value | Rule |
|-------|-------|------|
| `--pacing-pin-min-vh` | 150 | below this a pin reads as a glitch (§3.2) |
| `--pacing-pin-max-vh` | 400 | beyond this users think the page froze (§3.3) |
| `--pacing-breathing-vh` | 80 | free-scroll "cut" between chapters (§3.4) |
| title-reveal window | 0.30–0.40 | of pin range (§3.5); payoff in final ~30% |
| stagger | 0.04–0.12 | per element, max 5 before overlap (§3.6) |
| density-max | 3 | simultaneous motion types per 50vh (§3.8) |

**Depth**: parallax multipliers `--depth-far` 0.05 … `--depth-front` 0.9, max 7 layers (§1.7).
Never repeat a multiplier across adjacent chapters (§4.3).

---

## 6. Component grammar

A chapter is a single `<section>` consuming **only** role tokens. Worked example:

```html
<section class="chapter" data-pattern="pinned-reveal">
  <p class="eyebrow">Chapter 01</p>
  <h2 class="title">The reveal</h2>
  <p class="summary">One restrained paragraph of lead copy.</p>
</section>
```
```css
.chapter   { background: var(--bg); color: var(--fg); padding: var(--space-4xl) var(--space-lg); }
.eyebrow   { font: 500 var(--size-caption)/1.2 var(--font-ui); color: var(--fg-dim); letter-spacing: var(--tracking-wide); }
.title     { font: var(--size-h1)/var(--type-lh-display) var(--font-display); }
.summary   { font: var(--size-body-lg)/var(--type-lh-body) var(--font-body); color: var(--fg-dim); max-width: 40ch; }
/* entrance — role easing + role duration, transform/opacity only */
.title     { opacity: 0; transform: translateY(40px); transition: opacity var(--dur-slow) var(--ease-reveal), transform var(--dur-slow) var(--ease-reveal); }
.is-in .title { opacity: 1; transform: none; }
```

The named library (HeroParallax, PinnedReveal, DepthFigure, TiltCard, MorphBackground,
HorizontalGallery, ScrubVideo, KineticHeadline, MagneticCursor) is built in Phase 6 against
exactly this grammar.

---

## 7. Banned patterns (hard gates)

Do **not** ship any of these — the doctor fails the build (folds taste-guardrails §1 + performance-budget):

- ❌ Animate `filter` / `blur()` / `brightness()` during scroll → ✅ crossfade stacked layers (rack focus).
- ❌ Animate `width/height/top/left/margin/padding` → ✅ `transform` + `opacity` only.
- ❌ Default easing (`ease`/`linear`) → ✅ `--ease-*` role token.
- ❌ Literal hex / `cubic-bezier()` / bare pin `vh` → ✅ a token.
- ❌ `setState` inside a scroll handler (React) → ✅ rAF / scrub proxy.
- ❌ Scroll-jack content < 800px, or pin > 3 sections without a release viewport.
- ❌ 3D tilt on touch or under `prefers-reduced-motion`; >7 depth layers; repeated depth multipliers.
- ❌ Center-aligning all text; one easing for a whole chapter.

---

## 8. Responsive & accessibility

- **Reduced motion first**: every effect degrades when `prefers-reduced-motion: reduce` — pins skip, layers snap to a stable mid-keyframe, tilt → 0.
- **Mobile**: collapse pinned scenes into stacked vertical cards below `--breakpoint-md`; no 3D rotation on touch.
- **Text is selectable HTML**, never baked into images; `aria-label` on visual nav.

---

## 9. Agent prompt cheat block

When building, resolve every value through this contract:

```
bg/surface/fg/fg-dim/accent/line → var(--<role>)         (theme decides the hex)
type                              → var(--font-*) + var(--size-*) + var(--lh-*)
spacing/layout                    → var(--space-*) / var(--radius-*)
easing                            → var(--ease-reveal|exit|playful|cut)   NEVER ease/linear
pin height                        → between --pacing-pin-min-vh and --pacing-pin-max-vh
between chapters                  → ≥ --pacing-breathing-vh
hot scroll path                   → transform + opacity ONLY
```

Pick a visual system from `references/film-archetypes.md` → its `themes/*.theme.json` supplies
the role values → build with the vars above → run the verify gate. One system, one theme file,
one coherent result.
