# Awwwards-tier techniques — the second-generation vocabulary

The base grammar (pinned chapters, parallax, mask reveals, morphs) gets a page
*considered*. These five techniques are what separate site-of-the-day work from
competent work. Each is shipped as a vetted pattern with its degrade contract;
all five run together in the live example at **`examples/atelier/`**.

House rules apply everywhere: one intentional easing curve, transform/opacity
hot paths only, `prefers-reduced-motion` composes a finished still (never a
blank), hover effects guarded by `@media (hover:hover)`, and the mobile tier
drops pointer-driven effects entirely.

---

## 1 · Shader-distorted imagery (the tier's signature)

Images that ripple and chromatic-split with **scroll velocity** and bulge under
the cursor — a WebGL quad sitting exactly over each `<img>`, DOM as the source
of truth for layout. No three.js needed: one ~150-line WebGL1 program
(see `examples/atelier/index.html`, `DistortionLayer`).

Core contract:

- A fullscreen-canvas overlay (`position:fixed; pointer-events:none`) draws one
  textured quad per tagged image (`data-distort`); quad rects re-sync from
  `getBoundingClientRect()` on scroll/resize, so the DOM keeps owning layout,
  a11y, and fallback.
- Fragment shader inputs: `uVel` (damped scroll velocity), `uHover`
  (damped cursor proximity), `uTime`. Distortion = small uv ripple
  (`sin(uv.y*k + uTime)*uVel`) + RGB split sampled at ±`uVel*px` + hover bulge.
- **The `<img>` stays in the DOM underneath** (visibility hidden only while the
  GL layer is alive). WebGL missing / context lost / reduced-motion → unhide
  the images: the page reads identically, minus the ripple.
- Velocity must be **damped time-based** (`1 − e^(−k·Δt)`) and clamped; raw
  wheel deltas read as glitch, not craft.

## 2 · Kinetic typography

Type that carries momentum: per-character **velocity skew/lift** on display
lines, and a letter-spacing scrub on eyebrows.

- Split display text into `<span class="ch">` (aria: keep the original string
  on the parent via `aria-label`, mark spans `aria-hidden`).
- Each frame: `ch.style.transform = skewY(vel*max) translateY(i-phased)` —
  transform-only, one rAF writer for the whole page, no per-char listeners.
- Cap skew (~6°) and lift (~0.18em). Past that it reads broken, not kinetic.
- Reduced motion: spans get `transform:none` and the scrub is skipped.

## 3 · Magnetic cursor + magnetic targets

A custom cursor dot that **lags** the pointer (damped, time-based) and CTAs
that lean toward it inside a proximity radius.

- Cursor: two fixed elements (dot + ring), driven by one rAF; the ring lags
  harder than the dot — the lag *is* the luxury.
- Magnetic targets (`data-magnetic`): inside ~90px, translate toward the
  pointer by up to ~14px and scale the ring up; outside, ease home.
- **Desktop, fine-pointer only**: gate the whole module behind
  `matchMedia('(hover:hover) and (pointer:fine)')`, keep the native cursor
  visible until the custom one is live, and never hide the native cursor for
  keyboard users (`:focus-visible` styles stay).

## 4 · Preloader → hero choreography

First impressions are ~40% of the wow. A counter/wordmark preloader that
**hands off into** the hero reveal — one continuous timeline, not a curtain
that vanishes and then a page that starts.

- Phase A (≤1.6s, capped): progress counter + wordmark over a solid plate.
  Tie it to real readiness (`document.fonts.ready` + hero image decode), with
  a hard timeout so slow networks see content, not a counter.
- Phase B: the plate **wipes** (clip-path inset, house easing) *while* the
  hero title staggers in behind it — overlap ≥0.3s; the seam is the craft.
- Reduced motion: skip phase A entirely; the page opens composed.
- Session-gate it (`sessionStorage`) so in-site navigation never replays it.

## 5 · Page transitions

Leaving a page is a cut; treat it like one. An overlay wipe covers the exit,
navigation happens under the cover, the next page enters through the
preloader's phase B — so exit and entrance share one grammar.

- Intercept same-origin link clicks → play the cover wipe (~0.45s) → then
  `location = href`. On load, if `sessionStorage` says "covered", enter via
  phase B instead of the preloader.
- Respect modified clicks (cmd/ctrl/shift/middle) and external/anchor links —
  never intercept those. Reduced motion: no wipe, instant navigation.
- With the View Transitions API available, prefer it — the manual overlay is the
  fallback. It is the modern way to do cinematic page/state transitions:
  - **Same-document** (state/route swaps, Mode B): `document.startViewTransition(() => updateDOM())`.
    Baseline across modern browsers; the browser crossfades old→new automatically.
  - **Cross-document MPA** (multi-page, e.g. plain Mode A pages): opt in with
    `@view-transition { navigation: auto; }` in CSS — the browser tweens between
    full page loads, no JS.
  - **Shared-element continuity**: give the element on both views the same
    `view-transition-name` (e.g. a product image that flies from grid → detail).
  - **Always** wrap in `prefers-reduced-motion`: skip `startViewTransition` (call
    the DOM update directly) and set `::view-transition-* { animation: none }`.
  - Style the transition via `::view-transition-old(name)` / `-new(name)` with a
    role easing token; keep it transform/opacity only.

---

## Degrade matrix (the doctor checks these)

| Technique | Reduced motion | Mobile / coarse pointer | No WebGL |
|---|---|---|---|
| Shader imagery | plain `<img>` | plain `<img>` (or calm ripple, no hover) | plain `<img>` |
| Kinetic type | static, fully-composed type | velocity skew off | n/a |
| Magnetic cursor | off | off (gated) | n/a |
| Preloader | skipped — page opens composed | shorter cap (1s) | n/a |
| Transitions | instant navigation | keep (cheap) | n/a |

## When NOT to use them

Editorial/long-read pages: skip 1 and 3 (they upstage content). Commerce: keep
hover distortion subtle or product imagery reads as damaged. Anything with
dense data UI: none of these — this vocabulary is for narrative pages.
