# Component Grammar

The named, token-driven building blocks of a cinematic-scroll build. Every component:

- references **only** semantic role tokens (`var(--bg)`, `var(--accent)`, `var(--ease-reveal)` …) — see [`design.md`](../design.md), so a [theme](../themes/theme-contract.md) swap restyles it for free;
- animates **transform + opacity only**, on a role easing curve;
- ships in **both modes** — `components/mode-a/<slug>.html` (self-contained, zero-build) and `components/mode-b/<slug>.tsx` (React/Next, `useGSAP`);
- carries a **degrade contract** (reduced-motion + touch + mobile) inline;
- is **doctor-verified** — each Mode A page scores ≥80 on `cinematic-doctor` (incl. token-conformance).

Catalogue + machine metadata: [`components/manifest.json`](../components/manifest.json).

---

## PinnedReveal

**What** — eyebrow → title → rule → summary reveal in sequence as a chapter scrolls into view (the *long take* title arrival).

**When** — any standard chapter entrance; the default reveal for body chapters.

**Degrade** — `IntersectionObserver` (no scroll handler); under `prefers-reduced-motion` everything is shown immediately, no transition. Mobile keeps it (no tilt/parallax to disable).

```html
<section class="chapter" aria-labelledby="t">
  <p class="eyebrow reveal">Chapter 01</p>
  <h2 class="title reveal" id="t">The reveal lands on the beat.</h2>
  <p class="summary reveal">One restrained paragraph.</p>
</section>
<!-- IO adds .is-in → staggered transform+opacity on var(--ease-reveal) -->
```

---

## HeroParallax

A hero "tracking shot": three-plus depth planes (background, midground subject, foreground detail) translate at graded scroll rates — far `0.16` / back `0.34` / mid `0.62` / near `1.18` — so the frame reads as a deep space rather than a flat image. The title rises with the split-line reveal pattern.

**When to use** — opening hero of a release/story page where you want immediate depth and a cinematic camera feel, without a full pinned chapter. Reach for `PinnedReveal` instead when you need scroll-scrubbed copy beats; reach for `DepthFigure` for a single tilt-on-cursor image card.

**How it drives motion** — Mode A progressively enhances: where CSS `animation-timeline: scroll()` is supported and motion is allowed, the browser drives the parallax and the JS stands down; otherwise a rAF-throttled scroll handler does exactly one read + one write per frame (transform only). The title reveal fires once via IntersectionObserver. Mode B scrubs each plane with a ScrollTrigger inside a `gsap.matchMedia` motion branch — no scroll listener, no per-frame setState.

**Degrade contract** —
- **Mobile (`max-width:768px`)** collapses to <=2 planes (the atmosphere and foreground-accent layers `display:none`); the display title shrinks. Planes hidden via `offsetParent === null` are skipped by the parallax loop so no work is wasted.
- **`prefers-reduced-motion: reduce`** disables all parallax and the reveal — every plane and line renders in its final, static position. No 3D tilt is used, so touch devices are inherently safe (§1.9).
- Decorative planes are `aria-hidden`; the section is `aria-labelledby` its `<h1>`, and `:focus-visible` carries an accent ring.

**Mode A usage**
```html
<!-- drop into any page; needs the :root token subset above it -->
<section class="hero" id="hero" aria-labelledby="hero-title">
  <div class="frame">
    <div class="plane" data-depth="0.16" aria-hidden="true"></div>
    <div class="plane" data-depth="0.62" aria-hidden="true"><div class="subject"></div></div>
    <div class="copy"><h1 class="title" id="hero-title">
      <span class="line"><span>Your headline here.</span></span></h1></div>
  </div>
</section>
```

---

## DepthFigure

**What it is.** A foreground image card held in depth. Two layered motions: (1) a rAF-throttled scroll parallax that drifts the `<img>` inside its card as the card crosses the viewport, and (2) a gentle pointer tilt (small `rotateX`/`rotateY` toward the cursor) that settles home with a playful overshoot. The card carries a soft token shadow; the image always has descriptive `alt`.

**When to use.** A hero plate, a product detail, an editorial figure, or any single foreground image that should read as an object in space rather than a flat picture — without tipping into a gimmick. One per ~viewport; don't stack tilts.

**Degrade contract.**
- **Touch / coarse pointer** → no 3D tilt at all (guardrails §1.9); the scroll parallax + entrance reveal stay alive (never a dead page).
- **Fine pointer + hover** → full tilt, gated behind `@media (hover:hover) and (pointer:fine)`; `will-change:transform` lives only inside that branch.
- **`prefers-reduced-motion: reduce`** → everything static: no entrance, no parallax, no tilt — a composed, still card.
- **Hot paths animate transform + opacity only** (no width/height/top/left/filter/blur, no `transition: all`); scroll is one read + one write per frame.

**Mode A usage.**
```html
<!-- inline the :root token subset, then drop the section in -->
<main><section class="stage" aria-labelledby="df-title">
  <p class="eyebrow" id="df-title">Plate 04 — held in depth</p>
  <div class="figure" data-depth><div class="figure__card">
    <img class="figure__img" src="/plate.jpg" alt="Brass chronometer on raw linen." width="1000" height="1250">
  </div></div>
</section></main>
<!-- keep the IntersectionObserver + rAF parallax + fine-pointer tilt script -->
```

---

## TiltCard

A reference card that tilts up to ~8 degrees in 3D toward the pointer (`perspective` + `rotateX`/`rotateY`) with an opacity-only specular sheen that tracks the cursor. The hot path animates transform and opacity only; the cursor position is published as CSS custom properties and read back into the transform once per frame.

**When to use.** A small set of premium tiles — editions, product cards, feature highlights — where a tactile, "leans toward the light" micro-interaction rewards a deliberate desktop hover. Not for dense grids (the per-card pointer math and composited layers add up) and not as the primary motion of a chapter.

**Degrade contract.**
- **Touch / coarse pointer:** no tilt, no listeners — the flat card is the whole experience (guardrails 1.9; 3D rotation fights native gestures and triggers motion sickness).
- **`prefers-reduced-motion: reduce`:** transform and the sheen are removed; the card is fully static.
- **No hover (`hover: hover`) or non-fine pointer:** the tilt media query never matches; you get the stable resting card.
- **Keyboard:** the card is focusable with a `:focus-visible` ring; focus never invokes tilt.

**Mode A usage.**
```html
<main><section aria-labelledby="tc-title">
  <article class="card" tabindex="0">
    <p class="eyebrow">Edition 04</p>
    <h2 class="title" id="tc-title">It leans toward the light.</h2>
    <p class="body">Hover to tilt; it settles flat on leave.</p>
  </article>
</section></main>
<!-- inline the :root tokens + the gated @media (hover:hover) and (pointer:fine) tilt rule + the rAF pointermove script -->
```
Doctor-verified (≥80; the library scores 96–99 — exact numbers drift as the scorer evolves).

---

## MorphBackground

**What it is.** A scroll chapter whose background morphs between two palettes (warm "before" → cool "after"). It stacks TWO full-bleed gradient layers and crossfades the top one in by **opacity** — `background-color` is never animated. A single progress prop `--morph` (0→1) is driven by a rAF-throttled scroll proxy, with a native CSS `animation-timeline: view()` path taking over where supported.

**When to use.** A transitional chapter where you want the atmosphere/temperature to shift as the reader descends, without a hard cut or a new section — e.g. moving from a sunlit intro into a cooler, quieter passage. Pairs well after a pinned reveal or hero.

**Degrade contract.** The foreground palette is fixed and a constant scrim sits over the gradient peaks, so type holds AA from top to floor. Under `prefers-reduced-motion: reduce` (and before the scroll proxy attaches), layer B stays at `opacity: 0` — the calm "before" state — and all entrance motion is disabled; the composition is still complete and readable. The crossfade is compositor-only (opacity), so it is touch-safe; there is no pointer-3D/tilt to gate. No JS dependencies in Mode A.

**Mode A usage.**
```html
<section class="morph" id="chapter-1" aria-labelledby="ch1-title">
  <div class="layer layer-a" aria-hidden="true"></div>   <!-- warm before -->
  <div class="layer layer-b" aria-hidden="true"></div>   <!-- cool after, opacity:var(--morph) -->
  <div class="scrim" aria-hidden="true"></div>
  <div class="chapter">
    <h2 class="title mask" id="ch1-title">The room cools as you descend.</h2>
  </div>
</section>
<!-- rAF writes --morph; @supports(animation-timeline:view()) drives it natively -->
```

---

## HorizontalGallery

A sticky section that turns vertical scroll into horizontal motion: the viewport pins while a flex card track translates on the X axis by scroll progress. It is the canonical "scroll down, gallery moves sideways" pattern for selected-works / product-lineup strips.

**What it is.** A tall `.gallery` wrapper (extra height = horizontal travel) holding a `position:sticky` `.gallery__pin`. Inside, a `.track` of `flex:0 0` cards is moved with `translate3d` only. The preferred engine is native CSS `animation-timeline: scroll()` (zero per-frame JS); a rAF-throttled `scroll` handler is the fallback. Mode B drives the same translate with GSAP `ScrollTrigger` (`pin:true, scrub:true`, `ease:"none"`), no React state in the hot path.

**When to use.** Horizontal galleries, case-study reels, lineup/feature strips — 3 to ~6 cards where horizontal browsing reads better than a vertical stack. Use exactly one pin and give it a release viewport before/after.

**Degrade contract.**
- **Desktop, motion OK:** pinned viewport, scroll scrubs the track left via CSS scroll-timeline (or rAF fallback).
- **Touch (≤768px):** pin is removed; `.track` becomes a native `overflow-x:auto` scroller with `scroll-snap-type:x mandatory` — no scroll-jacking, no JS.
- **`prefers-reduced-motion: reduce`:** identical native horizontal scroller, all transitions off.
- **Always:** every card is a focusable `<a role="listitem">` inside `role="list"`, with a `:focus-visible` outline in `var(--accent)`; no 3D tilt anywhere.

**Mode A usage**
```html
<!-- paste the component's :root token block + <style>, then: -->
<section class="gallery" aria-labelledby="g-t" aria-roledescription="horizontal gallery">
  <div class="gallery__pin">
    <header class="gallery__head"><h2 class="title" id="g-t">Selected works</h2></header>
    <div class="track" role="list" aria-label="Gallery cards">
      <a class="card" role="listitem" href="#" aria-label="Work 01">…</a>
    </div>
  </div>
</section>
<!-- the inline IIFE auto-inits; resize/media-query changes re-init it -->
```

---

## ScrubVideo

**What it is.** A pinned-stage scroll section that maps scroll progress (0→1 across a tall track) onto a `<video>`'s `currentTime`, seeking on `requestVideoFrameCallback` (frame-accurate) with a `requestAnimationFrame` fallback. The video is muted, `playsinline`, posters before paint, and never autoplays — the only thing that moves it is your scroll position. A poster `<img>` sits over the video and cross-fades out (exit curve) once `loadedmetadata` fires.

**When to use.** Hero "exploded-view" / assembly / fly-through moments where the user should feel they are *driving* the footage — product teardowns, chronometer assembly, camera dollies. Reach for `PinnedReveal` instead when the payoff is type, not footage.

**The degrade contract.** Scrubbing a `<video>` off-gesture is blocked on iOS/touch Safari (it gates `currentTime` seeks behind a user gesture and won't decode), so on `(hover:none) and (pointer:coarse)` and under `prefers-reduced-motion: reduce` the component collapses the tall track, drops the `<video>`, and rests on the poster still — a stable, accessible fallback, not a dead frame. For a true scrubbed look on touch, swap the `<video>` for a canvas image-sequence: preload `/frames/NNNN.webp` and `drawImage` the frame at `Math.round(progress * (n-1))` on rAF (noted in the script). Every `<img>` carries `alt`; the `<video>` carries `poster` + `muted` + `playsinline` + `aria-label`; the section is `aria-labelledby` its visible title.

**Mode A usage**
```html
<!-- 1) drop the <section class="scrub"> block into a page that already loads your tokens -->
<!-- 2) point the video <source> at your clip and set the poster + alt/aria-label to match -->
<video class="frame" id="sv-video" preload="auto" muted playsinline
       poster="/footage/assembly-poster.webp"
       aria-label="Chronometer assembly, scrubbed by scroll position.">
  <source src="/footage/assembly.mp4" type="video/mp4">
</video>
<!-- 3) tune scrub speed via .scrub{height:320vh} — taller track = slower seek -->
```


---

## KineticHeadline

A multi-line headline whose **words rise out of per-line clip-masks** and stagger in on transform + opacity as the heading scrolls into view — the *split-line-rise* title treatment (taste-guardrails §4.5). It reads as one sentence to assistive tech: the `<h2>` carries a clean `aria-label`, while the decorative word spans are `aria-hidden`, so screen readers hear the headline once instead of spelling it out word-by-word.

**When to use** — chapter/section openers and editorial hero headlines where you want a literary, choreographed entrance with more texture than a single fade. Reach for the plain `reveal` pattern instead when the line is short (≤4 words) or the moment calls for restraint.

**Degrade contract**
- **Reduced motion** (`prefers-reduced-motion: reduce`): no cascade — the line-masks open (`overflow:visible`, so descenders aren't clipped) and every word is shown static, instantly. Mode B's `gsap.matchMedia` simply never registers the tween.
- **No JS / observer not yet fired** (Mode A): words start hidden behind the mask; if you need a no-JS-visible fallback, hoist the `.is-in` styles to default and let JS only *delay* them. The shipped default favors the animated path.
- **Mobile (<768px)**: same compositor-only cascade (transform + opacity), no tilt/parallax, smaller display size. There is no 3D to disable (§1.9).
- **Accessibility**: change the headline copy in *both* the `aria-label` and the visible word spans; the label is the source of truth for AT.

**Mode A usage**
```html
<h2 class="kinetic" id="t" aria-label="Every word arrives on its own beat.">
  <span class="line" aria-hidden="true">
    <span class="word" style="--i:0">Every</span><span class="word" style="--i:1">word</span><span class="word" style="--i:2">arrives</span>
  </span>
  <span class="line" aria-hidden="true">
    <span class="word accent" style="--i:3">on its own</span><span class="word accent" style="--i:4">beat.</span>
  </span>
</h2>
<!-- IntersectionObserver adds .is-in on the .chapter; CSS owns the per-word --i stagger -->
```

---

## MagneticCursor

A custom cursor dot that rAF-lerps toward the pointer and snaps toward magnetic targets (real `<a>`/`<button>` carrying `data-magnetic`) on hover. The dot is purely decorative (`aria-hidden`); the underlying controls stay real, focusable, and clickable.

**When to use** — editorial/launch heroes and index pages where you want a tactile, intentional pointer that "leans into" CTAs. Skip it on dense form-heavy UIs where a precise native cursor matters.

**Degrade contract** — the effect is gated to `@media (hover:hover) and (pointer:fine)`. On touch devices or `prefers-reduced-motion: reduce`, the JS loop never starts, the dot stays `display:none`, and the **native cursor is restored** (guardrail 1.9). All motion is transform + opacity, driven by a single rAF tick; `pointermove` only records coordinates (guardrails 1.6, 1.8). No React state is touched in the loop (1.5).

**Mode A usage**
```html
<!-- 1. Drop the decorative dot just inside <body>, before <main> -->
<div class="cursor" id="cursor" aria-hidden="true"></div>
<!-- 2. Mark any real <a>/<button> as a magnet -->
<a class="btn" data-magnetic href="/chapter">Read the chapter</a>
<button class="btn" data-magnetic type="button">Toggle sound</button>
<!-- 3. The inline script self-gates to fine pointers and runs one rAF lerp loop. -->
```

