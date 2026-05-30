---
name: cinematic-scroll
description: Build cinematic scroll-driven, 3D-tilt, parallax, and environment-morphing pages — from a single self-contained scroll section to a full Shopify-Editions-style release website with AI-generated visual assets (React, Next.js, choreo-3d, GSAP, Framer Motion, fal.ai). Use for scroll choreography, pinned chapter reveals, hero parallax, depth-image figures, hover-tilt cards, background-morphing layouts, release/launch pages, product story pages, AI launch pages, or editorial commerce microsites.
---

<!--
=============================================================================
HUMAN READING THIS BY ACCIDENT? You don't need to. This file is for Claude.

Open README.md instead — it's the human quickstart.

This file (SKILL.md) is the machine-readable contract the agent reads when the
skill is invoked. It's long and technical by design.
=============================================================================
-->

# Cinematic Scroll

Reusable patterns + production templates for building cinematic, scroll-driven React pages: pinned chapters, multi-depth parallax, 3D mouse tilt, environment-morphing backgrounds, reduced-motion-safe degradation, and (optionally) a full Next.js release site with fal.ai-generated visuals.

The reference direction is Shopify Editions Winter 2026: a release-notes page treated as a visual world. Do not copy Shopify assets, layout, logos, source code, or exact composition. Borrow the product pattern only: dramatic chaptered scrolling, classical or editorial imagery, modern UI artifacts, large type, persistent navigation, indexed structure, and a product-update taxonomy.

---

## Two modes — pick by scope

This skill operates at two altitudes. **Decide which the user is asking for, then follow that mode.** The motion grammar (the "Mandatory motion + craft requirements" below) is identical for both.

| | **Mode A — Scroll artifact** | **Mode B — Full release site** |
|---|---|---|
| Use when | "Build a scroll section / hero / pinned chapter / parallax demo" | "Build a full release / launch / product-story website", "Shopify-Editions-style page", "with AI-generated images" |
| Output | One self-contained `.html` (preferred for instant preview) or a `.tsx` component | A Next.js App Router project scaffolded from `templates/nextjs/` |
| Build step | None | `npm install && npm run dev` |
| AI assets | None (CSS/SVG/static only) | Optional fal.ai pipeline (bring your own key) |
| Section to follow | **§ MODE A** | **§ MODE B** |

If the request is ambiguous, default to **Mode A** for a single section and **Mode B** when the user says "site", "page", "release", "launch", or "landing".

---

## Output rule — always produce runnable code (both modes)

**Do not stop at an explanation.** Every invocation must produce a complete, runnable artifact placed where the user can run it. Architecture notes are welcome as a short preamble (≤5 lines), but the code is mandatory.

**Correct response shape:**

```
[Brief plan / architecture note — 5 lines max]
[Full runnable artifact, or files written one tool call per file]
[2-3 lines: how to run / scroll / what to look for first]
```

Never end a response with only an explanation. Always close with the artifact.

---

## Quality bar — match these references (both modes)

Output must compete with:

- **Shopify Editions** (Winter / Summer drops) — the primary reference: multi-chapter release worlds
- **Apple product launch pages** (`apple.com/iphone`, `apple.com/vision-pro`) — pinned cinematic sequences
- **Linear release notes** (`linear.app/releases`) — editorial typography + restraint
- **Stripe Sessions** — depth-of-field + atmospheric morphing
- **Awwwards SOTD nominees** in Editorial + Product Launch categories

"Looks like a Bootstrap landing page" or "looks like a Tailwind UI template" = failure. Output should look studio-crafted. If constraints (no imagery budget, sandbox, tight deadline) prevent this tier, **say so explicitly** and deliver the highest-quality fallback the constraints allow — never ship mid-tier silently.

---

## Mandatory motion + craft requirements (both modes)

Every artifact MUST satisfy ALL of these. No exceptions for "demo simplicity" — the demo IS the product.

### 1. Multi-depth field — minimum 5 layers

Two-layer parallax (bg + fg) is amateur. A real depth field uses 5-7 layers at distinct depth multipliers:

| Depth | Role | Examples |
|---|---|---|
| 0.15 | Atmospheric far | Sky gradient, distant fog, soft glow |
| 0.30 | Mid-far | Distant props, blurred shapes, horizon |
| 0.50 | Mid | Subject background, atmospheric texture |
| 0.75 | Subject | Main figure / image / 3D object |
| 1.00 | UI text | Title, body copy, eyebrow label |
| 1.20 | Foreground accents | Floating numbers, edge labels, brackets |
| 1.40 | Closest overlays | Cursor highlights, badges, scroll cue |

Lower depth = slower = perceptually farther. Pick at least 5 of these 7 slots for any cinematic chapter.

### 2. 3D perspective camera

Set `perspective: 1200px` on the chapter wrapper (or `perspective: none` for flat sections, but never omit the declaration). Use scroll-driven 3D transforms on at least one layer:

- `rotateX(±4deg max)` — gentle pitch (avoid motion sickness)
- `rotateY(±2deg max)` — subtle yaw, great for hero figures
- `translateZ(0px → -80px)` — dolly-back effect for chapter transitions
- `scale + rotateX` combo for "swooping" entrances

Disable all 3D rotation on touch devices AND when `prefers-reduced-motion: reduce`.

### 3. Type reveal patterns

Plain `opacity: 0 → 1` on oversized titles is lazy. Use one of:

- **Word stagger** — split into words, each enters on a 5% offset over 20-30% of pin scroll
- **Letter stagger** — for short titles (≤12 chars), animate letter by letter
- **Mask reveal** — `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` (horizontal wipe)
- **Vertical mask** — `clip-path: inset(100% 0 0 0)` → `inset(0 0 0 0)` (upward reveal)
- **Scrub letter-spacing** — `letter-spacing: 0.4em → 0em` ("settling" effect)

Combine with `translateY()` and `opacity` for layered impact.

### 4. Smooth scrolling — mandatory in production output

Production artifacts MUST wrap the page in Lenis (`lenis` npm package — **not** `@studio-freight/lenis`, which is deprecated and capped at 1.0.42). Native browser scroll is jittery on macOS trackpads and produces visible stepping on scroll-scrubbed animations. Forward Lenis's RAF tick to GSAP ScrollTrigger if both are used.

Single-file HTML demos (sandbox previews) may skip Lenis but MUST use `requestAnimationFrame`-throttled scroll handlers (not raw `scroll` events).

### 5. Mobile-responsive — mandatory

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- All typography in `clamp(min, fluid, max)` — never fixed `px` for `font-size`
- Disable pinned scroll below `768px` — replace with IntersectionObserver-driven fade-up (sticky+JS scroll fights iOS Safari momentum)
- `env(safe-area-inset-*)` padding on fixed nav / overlays
- Tap targets ≥ `44px` square (Apple HIG minimum)
- Mobile-first: design at 375px viewport FIRST, then scale up

### 6. Loading sequence

- Preload critical background images with `<link rel="preload" as="image">`
- Show a poster / blurred low-res placeholder (LQIP) during decode
- First paint readable within ~1.5s on simulated 4G — never a black page
- In Next.js, use `<Image>` with `priority` on above-the-fold imagery; lazy-load below-the-fold chapters

### 7. Performance — 60fps on M1 + iPhone 13

- Only `transform` and `opacity` mutate per scroll frame — never `width`, `height`, `top`, `left`, `filter`, `box-shadow`
- `will-change: transform` on animated layers ONLY (never globally — kills GPU memory)
- `translate3d(0,0,0)` to force GPU compositing where needed
- Cache `getBoundingClientRect()` once on init + resize, never per scroll frame
- No layout reads in scroll handlers (no `offsetTop`, `clientHeight` per frame)
- Chrome DevTools Performance flame chart = all green (composite only) during scroll
- Lighthouse Performance ≥ 90 on the generated page

---

## Core principles (both modes)

1. **Reduced motion first.** Every effect must degrade gracefully when `prefers-reduced-motion: reduce` is set. Pin hooks skip GSAP, layers snap to a stable mid-keyframe, tilt returns zeros.
2. **iOS WebKit video safety.** Safari/iOS Chrome freezes `<video>` frames inside a `transform-style: preserve-3d` ancestor that updates. Detect touch (`(hover: none) and (pointer: coarse)`) and bypass the 3D wrapper for video.
3. **Animate transform + opacity only** in hot scroll paths.
4. **Pin chapters, not the page.** Each cinematic block opts into pinning. The rest of the document scrolls normally. Long single pins fight smooth-scroll libraries.
5. **Deterministic motion.** Any procedural value (seed, jitter, keyframe array) must be stable across re-renders so SSR and resize don't shift layout.

---

## Component rules (both modes)

- Every full-screen chapter must have an `id` and a single `<section>` wrapper, plus `eyebrow`, `title`, `summary`, `features`, `asset`, `accent`.
- All text overlays must be **selectable HTML**, never baked into images.
- Use `aria-label` on visual navigation controls (chapter index, dots, arrows).
- Avoid scroll hijacking. Pin only the chapter body, not the entire page forever.
- On mobile, collapse pinned scenes into stacked vertical cards with the same content order.
- Prefer 16:9 backgrounds and 4:5 foreground figures. `object-fit: cover` for backgrounds, `object-fit: contain` for figures.
- In Next.js, use `next/image` over raw `<img>`.

---

## Performance gates (both modes)

| Gate | Requirement |
|---|---|
| Images | WebP or AVIF, max 2400px long edge for backgrounds |
| Video | Muted, looped, `playsInline`, MP4 or WebM, `preload="metadata"` on touch |
| Animation | Only `transform` and `opacity` in scroll paths |
| Bundle | Code-split heavy chapters; lazy-load below-the-fold media |
| Mobile | No `preserve-3d` ancestor around active video on touch devices |
| Reduced motion | Pinning and heavy transforms disabled |
| Failure | If a media URL fails, show gradient / poster / static image fallback |

---

## QA checklist (both modes)

- [ ] `npm run lint` passes (Mode B)
- [ ] `npm run typecheck` passes (Mode B)
- [ ] `npm run build` passes (Mode B)
- [ ] Every image has meaningful `alt` text (or `alt=""` if purely decorative)
- [ ] `prefers-reduced-motion: reduce` produces a usable, non-pinned page
- [ ] Mobile Safari plays or gracefully skips video loops
- [ ] Page is readable with all media disabled (network throttle test)
- [ ] Chapter scroll-spy updates the morph and the index
- [ ] No layout shift when chapter assets load (intrinsic sizes / poster frames)
- [ ] The page is inspired by the reference but not a visual clone

---

## Legal and originality rules (both modes)

- Do not reproduce the Shopify logo, screenshots, copy, proprietary illustrations, exact section design, or exact visual scene.
- Do not generate images that imitate a living artist by name.
- Do not bake readable UI copy into generated images unless the user specifically asks and the target model supports reliable text.
- Build UI text, labels, nav, cards, numbers, and feature lists as HTML/CSS so they remain editable, accessible, and crisp.
- Use the reference only as an art-direction benchmark: chaptered release storytelling, not a clone target.
- If the user asks to clone a proprietary site exactly, respond by making an original system that uses the reference as inspiration.

---
---

# § MODE A — Scroll artifact (single section / page, no build)

Use this for "build a scroll section / hero / pinned chapter / parallax demo" requests. Produce a **single self-contained HTML file** (`<!DOCTYPE html>` … `</html>`, inline CSS + JS) so the artifact renders immediately with no build step. If the user's project is React/Next.js, also produce a `.tsx` file plus a companion `index.html` demo.

## Primitives — `choreo-3d`

When `choreo-3d` is available, import:

```ts
import {
  // Hooks
  useScrollPin,
  useScrollPinContext,
  useTilt3D,
  useMouseSpring,
  // Components
  ScrollChoreography,
  ScrollLayer,
  ScrollDepthImage,
  ScrollBackgroundMorph,
} from 'choreo-3d';
```

| Primitive | Use it for |
|---|---|
| `ScrollBackgroundMorph` | Crossfade chapter atmospheres / color worlds based on active section id |
| `ScrollChoreography` | Pin a chapter while scroll drives the reveal |
| `ScrollLayer` | Interpolate subject, UI panels, oversized titles, foreground props inside a pinned chapter |
| `ScrollDepthImage` | Render a hero figure with parallax + scale swell + optional 3D hover tilt + ping-pong video loops |
| `useMouseSpring` | Subtle pointer drift on decorative foreground elements (global) |
| `useTilt3D` | Tactile hover tilt on hero cards / glass panels (local, non-touch only) |
| `useScrollPin` | Build your own pinned context when `ScrollChoreography` isn't flexible enough |

## No-package fallback (sandbox / CDN-restricted environments)

When `choreo-3d` **cannot be installed** (no npm, CDN sandbox, StackBlitz without installs), build the **identical behaviour** with sticky positioning + `rAF`-throttled scroll + inline keyframe interpolation + a `prefers-reduced-motion` check. Name the functions the same so the code reads like the real package.

```ts
// Equivalent to useScrollPin
function useScrollProgress(ref, pinDistance) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1); return;       // snap to end-state, no scroll binding
    }
    function onScroll() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const p = Math.max(0, Math.min(1, -rect.top / (pinDistance - window.innerHeight)));
      setProgress(p);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref, pinDistance]);
  return progress;
}

// Equivalent to ScrollLayer keyframe interpolation
function interpolate(p, keyframes) {
  const keys = Object.keys(keyframes[0]).filter(k => k !== 'at');
  const lo = [...keyframes].reverse().find(f => f.at <= p) ?? keyframes[0];
  const hi = keyframes.find(f => f.at >= p) ?? keyframes[keyframes.length - 1];
  const t = hi.at === lo.at ? 1 : (p - lo.at) / (hi.at - lo.at);
  return Object.fromEntries(keys.map(k => {
    const a = parseFloat(lo[k]); const b = parseFloat(hi[k]);
    const unit = String(lo[k]).replace(/[-\d.]/g, '');
    return [k, `${a + (b - a) * t}${unit}`];
  }));
}
```

Apply results as a depth-multiplied transform string, exactly as `ScrollLayer` does:

```ts
const bg = interpolate(progress, slowBg);
const style = {
  transform: `translateY(calc(${bg.y} * ${depth})) scale(${bg.scale})`,
  opacity: bg.opacity,
};
```

### Critical: background layer must never start invisible

The background layer (`depth < 1`) must start with `opacity ≥ 0.85` at `at: 0`. If the scroll listener fails (iframe, sandbox, wrong scroll root) the page must show *something*, not a black void.

```ts
const slowBg = [
  { at: 0,   y: '-3%', scale: 1.06, opacity: 0.9 },  // ← never 0
  { at: 0.5, y: '0%',  scale: 1.02, opacity: 1   },
  { at: 1,   y: '3%',  scale: 1.08, opacity: 0.9 },
];
```

### Known sandbox / iframe limitation

Sandboxed preview iframes may not route wheel/touch scroll to sticky containers. If progress stays at `p = 0`, text layers (starting at `opacity: 0`) become invisible — the "black page" failure mode. Fixes, in order:

1. **Attach scroll listener to the container element, not `window`**, and set the sticky root to that container (`<div ref={containerRef} style={{ height: '100vh', overflowY: 'scroll' }}>` + read `el.scrollTop`).
2. **Guaranteed visible initial state** — render text at hold-position opacity until the first scroll fires (`opacity = hasScrolled ? interpolated : 1`).
3. **Live progress HUD** — always include in sandbox demos so the math is visible:

```tsx
<div style={{ position: 'fixed', top: 12, right: 12, fontFamily: 'monospace',
  fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '4px 8px',
  borderRadius: 4, zIndex: 999 }}>p = {progress.toFixed(3)}</div>
```

If `p` stays `0.000` while scrolling, the listener is attached to the wrong root.

**Always prefer the real `choreo-3d` package for production** — it handles GSAP ScrollTrigger scrub, resize debounce, and iOS video safety automatically. Use this fallback only when the package truly cannot load.

## Standard composition

```tsx
<page>
  <ScrollBackgroundMorph activeId={...} themes={...} />   {/* fixed, fades chapter atmospheres */}
  <TopNav />                                              {/* fixed, HTML overlay */}
  <ChapterIndex />                                        {/* fixed, scroll-spy */}

  {chapters.map(chapter => (
    <section id={chapter.id}>
      <ScrollChoreography pinDistance="140vh">
        <ScrollLayer keyframes={slowBg} depth={0.35} />   {/* parallax background */}
        <ScrollLayer keyframes={layerIn} depth={1.0} />   {/* title + panel + figure */}
      </ScrollChoreography>
    </section>
  ))}
</page>
```

### Manifest pattern — drive the page from data, not inline JSX

```ts
type Chapter = {
  id: string;             // matches the <section id=…> AND the morph theme key
  roman?: string;
  eyebrow: string;
  title: string;
  summary: string;
  features?: string[];
  accent: string;         // CSS color
  background: string;     // image URL
  foreground?: string;    // optional figure
  poster?: string;
  video?: string;
};
```

### Keyframe defaults

```ts
// Subject / UI layer: rises in, holds, drifts out
const layerIn = [
  { at: 0,    y: '14%',  scale: 0.94, opacity: 0 },
  { at: 0.25, y: '0%',   scale: 1,    opacity: 1 },
  { at: 0.78, y: '0%',   scale: 1,    opacity: 1 },
  { at: 1,    y: '-10%', scale: 0.98, opacity: 0 },
];
// Background: slow inverse drift to suggest depth
const slowBg = [
  { at: 0,   y: '-3%', scale: 1.06, opacity: 0.9 },
  { at: 0.5, y: '0%',  scale: 1.02, opacity: 1   },
  { at: 1,   y: '3%',  scale: 1.08, opacity: 0.9 },
];
```

`depth < 1` slows a layer (parallax background). `depth > 1` accelerates it (foreground UI). `depth = 1` matches scroll 1:1.

### Scroll-spy for the morph

```tsx
const [activeId, setActiveId] = React.useState(chapters[0]?.id ?? null);
React.useEffect(() => {
  const nodes = chapters.map(c => document.getElementById(c.id)).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target.id) setActiveId(visible.target.id);
  }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-10% 0px -10% 0px' });
  nodes.forEach(n => observer.observe(n));
  return () => observer.disconnect();
}, []);
```

## Common mistakes (Mode A)

1. **Pinning the whole page.** Pin per-chapter; long single pins fight smooth-scroll.
2. **Animating filter / box-shadow on scroll.** Compositor-only (`transform`, `opacity`) keeps 60fps.
3. **Hardcoding chapter IDs in the morph.** Pass a `themes` map keyed by chapter id.
4. **Forgetting reduced motion.** Test with macOS → Accessibility → Reduce Motion ON.
5. **Wrapping video in 3D ancestors on iOS.** Detect touch and degrade safely.

---
---

# § MODE B — Full release site (Next.js + fal.ai)

Use this when the user wants a complete release / launch / product-story website. This mode turns a product, release, campaign, or system narrative into a polished one-page site with cinematic scroll chapters, art-directed visuals, live HTML overlays, and an optional fal.ai asset pipeline.

## CRITICAL — read the bundled templates

This skill ships `templates/nextjs/` with tested, production-safe code. You MUST read those files and copy them into the user's workspace **verbatim** — do NOT regenerate them from memory. The templates contain tested fal.ai server-proxy logic, CORS handling, prompt-contract structures, and a **verified `package.json`** that installs cleanly.

**If you regenerate API routes, fal helpers, or `package.json` from memory, the project will break** (wrong Lenis package, missing `choreo-3d`, `npm install` failures).

### Copy verbatim (do not rewrite logic)

- `templates/nextjs/package.json` — **exact dependency versions; never invent packages**
- `templates/nextjs/app/api/fal/proxy/route.ts` — hardened proxy (PUT + allowedEndpoints)
- `templates/nextjs/app/api/fal/webhook/route.ts` — webhook receiver for queue mode
- `templates/nextjs/app/api/generate-edition-asset/route.ts` — supports `mode: 'sync' | 'queue'`
- `templates/nextjs/lib/fal-client.ts`
- `templates/nextjs/lib/fal-models.ts` — **per-model input adapter** (FLUX vs Gemini vs Imagen params)
- `templates/nextjs/lib/fal-generate.ts` — uses the adapter; do NOT inline `image_size` or `negative_prompt`
- `templates/nextjs/lib/prompt-contract.ts` — `EDITION_AVOID` is inlined into the prompt string (FLUX.2 ignores `negative_prompt`)
- `templates/nextjs/lib/use-lenis.ts`
- `templates/nextjs/lib/use-device.ts` — isMobile / isTouch / useReducedMotion hooks
- `templates/nextjs/components/SmoothScrollProvider.tsx`
- `templates/nextjs/components/ChapterScene.tsx` — **the 7-layer cinematic scene** (perspective camera + word-stagger title + mobile fallback)
- `templates/nextjs/components/ChapterDemoVisual.tsx` — CSS-only chapter visual so the page looks stunning with zero fal.ai setup
- `templates/nextjs/components/EditionsPage.tsx` — orchestrator (extend chapter content via manifest, not by rewriting the scene)
- `templates/nextjs/app/layout.tsx` (viewport + metadata)
- `templates/nextjs/app/page.tsx` (wraps in SmoothScrollProvider)
- `templates/nextjs/app/globals.css` — fluid clamp() type scale + safe-area + reduced-motion + touch overrides
- `templates/nextjs/scripts/generate-chapter-assets.mjs` — batch generator (downloads binaries to `public/generated/`)
- `templates/nextjs/scripts/setup.mjs` — interactive fal.ai key wizard
- `templates/nextjs/tsconfig.json`
- `templates/nextjs/tailwind.config.ts` — fluid font-size tokens
- `templates/nextjs/postcss.config.js`

### Customise per project (content only)

- `templates/nextjs/lib/editions-manifest.ts` — **8 chapters by default**; replace with project-specific chapters (6–12 sweet spot)
- `templates/nextjs/tailwind.config.ts` colors — theme colors per brand

### Dependency rules — hard failures if violated

| Rule | Correct | Wrong (breaks install) |
|---|---|---|
| Smooth scroll | `lenis` (^1.3.23) | `@studio-freight/lenis` — **deprecated; max version 1.0.42; ^1.0.45 does not exist** |
| Motion primitives | `choreo-3d` from npm | Hand-rolled parallax only — **forbidden** |
| Parallax layers | `ScrollLayer`, `ScrollChoreography`, `ScrollBackgroundMorph` from `choreo-3d` | Custom `ParallaxChapter.tsx` reimplementing the library |

**Never remove `choreo-3d` from dependencies.** The page must import motion primitives from it.

### Quality bar — already implemented in templates

The bundled `ChapterScene.tsx` already implements every mandatory motion + craft requirement above. **Do NOT downgrade it.** Do not collapse the 7 layers to 2, do not remove the `perspective: 1200px` wrapper, do not replace the word-stagger title with a plain opacity fade, do not drop the mobile-stacked fallback. For a *different* visual treatment, extend the manifest or add a new variant component — never rewrite `ChapterScene.tsx` from memory.

### Install commands — one line at a time

List **one shell command per line**. Never paste a multi-line README block with `#` comments — zsh treats `#` as a command and fails.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Page generation sequence

1. Extract the site subject.
2. Convert it into a release taxonomy with 6 to 12 chapters.
3. For each chapter, write one product claim, one technical detail, one visual metaphor, one modern object, and one CTA / proof point.
4. Build `editions-manifest.ts` from that taxonomy.
5. Generate fal.ai prompt inputs from the manifest (if using AI assets).
6. Scaffold the page using `EditionsPage.tsx` + `ChapterScene.tsx`.
7. Place image / video assets through `ScrollDepthImage` and HTML overlays.
8. Add chapter index, keyboard navigation, reduced-motion fallback, mobile-safe layout.
9. Add QA gates.
10. Return implementation notes plus runnable commands.

## Output contract

| Layer | Required output | Rule |
|---|---|---|
| Narrative | One clear theme, 6–12 chapters, each with a product claim | Every chapter maps to a real feature, not decorative filler |
| Art direction | Visual system, palette, typography, image prompt system | Use original assets, never copy reference assets |
| Asset pipeline | fal.ai prompt plan, model config, output sizes, filenames | Keep `FAL_KEY` server-side only |
| Interface | Next.js page, responsive layout, chapter nav, progress index | UI text overlays must be HTML, not baked into images |
| Motion | Scroll pinning, parallax layers, background morphs, hover depth | Always respect reduced motion |
| QA | Performance, accessibility, legal, mobile Safari, failure fallbacks | No effect ships without fallback |

## Design grammar (default unless the user gives a different direction)

| Element | Direction |
|---|---|
| Visual base | Oil painting, editorial photography, 3D render, or cinematic collage |
| Contrast layer | Modern commerce object, software UI, AI terminal, mobile device, product artifact |
| Typography | Oversized grotesk for product claims, elegant serif or italic for editorial tension |
| Navigation | Persistent top nav plus left/right chapter index with Roman numerals or numeric anchors |
| Composition | Full viewport chapters, large central subject, translucent UI panels, fine grid lines, soft vignettes |
| Motion | Slow parallax background, mid-speed subject, fast foreground UI labels, pinned chapter reveals |
| Color | Muted old-world backgrounds plus one modern accent (acid pink, neon green, electric blue, chrome) |
| Texture | Grain, canvas, paper, dust, bloom, shadows, glass, engraved labels |
| Copy | Short, declarative product language. No marketing fog. Claim first, detail second |

## fal.ai integration

### Bring-your-own-key — this skill includes NO keys or credits

This skill does NOT ship fal.ai keys, credits, or a shared account. Every user creates their own fal.ai account and pays fal directly (pay-as-you-go). The page also works **without fal.ai** — `ChapterDemoVisual` renders stunning CSS-only chapter visuals at $0, and users can drop their own static images into `public/`.

When the user is new, asks about keys/costs/setup, or hasn't configured fal.ai:

1. Walk them through **`examples/GETTING_STARTED.md`** step by step.
2. State clearly: sign up at [fal.ai](https://fal.ai), create an API key, add `FAL_KEY` to `.env.local`.
3. Remind them to **restart the dev server** after adding env vars.
4. Never put `FAL_KEY` in client components, `'use client'` files, or committed `.env` files.
5. Mention they can skip fal.ai entirely and use static images.

### Technical rules

1. Never expose `FAL_KEY` in browser code.
2. Use `@fal-ai/server-proxy/nextjs` when the browser calls fal through `/api/fal/proxy`. Export `GET`, `POST`, **and `PUT`** — the newer client requires all three.
3. **Always go through `lib/fal-models.ts`.** Do NOT inline `image_size`, `aspect_ratio`, `num_images`, or `negative_prompt` in calling code — each fal model accepts a different set, and inlining silently breaks Gemini ↔ FLUX swaps.
4. Use server routes for production asset generation, moderation, logging, prompt normalization, and cost tracking.
5. Use `fal.subscribe` for blocking generation (prototyping, ≤5 chapters). Use `fal.queue.submit` + `app/api/fal/webhook/route.ts` for batches >5 images, video, or any model with cold-start ≥10s.
6. In production, set `allowedEndpoints` on the proxy + `allowUnauthorizedRequests: false`.
7. Make model ids configurable via environment variables.

### Per-model parameter quirks (verified from fal.ai docs, 2026)

| Param | FLUX.2 Pro | Gemini 3 Pro / Flash | Imagen 3 |
|---|---|---|---|
| Orientation | `image_size: 'landscape_16_9'` | `aspect_ratio: '16:9'` | `aspect_ratio: '16:9'` |
| Number of images | **not supported** (always 1) | `num_images: 1..4` | `num_images: 1..4` |
| Negative prompt | **not supported** — inline in prompt text | not supported — inline | not supported |
| Resolution | fixed 4MP | `resolution: '1K' \| '2K' \| '4K'` | fixed |
| Output format | `'jpeg' \| 'png'` | `'jpeg' \| 'png' \| 'webp'` | png |

This is exactly why `lib/fal-models.ts` exists — it maps a single `GenericImageRequest` to whichever shape the chosen model needs. See `MODELS.md` for the full model menu and cost table.

Environment variables:

```bash
FAL_KEY="key_id:key_secret"
# fal-ai/flux-2-pro       ← RECOMMENDED default (FLUX.2 [pro], 4MP, ~$0.06/img, ~4s)
# fal-ai/flux-2-max       ← highest quality (~$0.08/img, ~5s) — final hero renders
# fal-ai/flux-2/turbo     ← fast iteration (~$0.02/img, ~2s) — draft rounds
# fal-ai/flux/dev         ← NON-COMMERCIAL LICENSE ONLY — never default in production
FAL_IMAGE_MODEL="fal-ai/flux-2-pro"
FAL_VIDEO_MODEL=""
NEXT_PUBLIC_SITE_NAME="Editions Demo"
```

**Never default to `fal-ai/flux/dev` in production code** — it is licensed non-commercially by Black Forest Labs.

### Server-side generation pattern — always go through the adapter

```ts
import { generateEditionImage } from '@/lib/fal-generate';

const asset = await generateEditionImage({
  chapterId: 'prologue',
  subject: 'two figures in a renaissance studio…',
  productTruth: 'the product turns updates into a release system',
  historicalLayer: 'renaissance',
  modernLayer: 'transparent software panel, AI terminal glow',
  palette: ['aged cream', 'deep umber', 'acid pink'],
  camera: 'wide',
  outputRole: 'hero',
});
// → { chapterId, url, modelId, requestId, raw }
```

Batch all chapters with one command:

```bash
node scripts/generate-chapter-assets.mjs                            # all chapters, default model
node scripts/generate-chapter-assets.mjs --dry-run                  # print prompts only, no cost
node scripts/generate-chapter-assets.mjs --only prologue,studio     # subset
node scripts/generate-chapter-assets.mjs --model fal-ai/gemini-3-pro-image-preview
```

## Prompt contract for generated assets

```ts
type EditionAssetPrompt = {
  chapterId: string;
  subject: string;
  productTruth: string;
  historicalLayer: 'renaissance' | 'baroque' | 'atelier' | 'architectural' | 'industrial';
  modernLayer: string;
  palette: string[];
  camera: 'wide' | 'medium' | 'macro' | 'isometric' | 'low-angle';
  outputRole: 'hero' | 'chapter-bg' | 'foreground-object' | 'poster' | 'motion-source';
};
```

Negative-prompt language is **inlined into the prompt string** (NOT sent as `negative_prompt`), because FLUX.2 Pro's input schema does not include it:

```txt
brand logos, unreadable text overlays, fake UI labels baked into the image, watermarks,
low resolution, distorted hands, extra limbs, over-saturated colour, plastic skin,
generic AI gloss, stock photography composition
```

## Motion recipe — use the existing choreo-3d primitives

| Primitive | Use |
|---|---|
| `ScrollBackgroundMorph` | Crossfade chapter atmospheres and color worlds |
| `ScrollChoreography` | Pin each cinematic chapter while scroll drives the reveal |
| `ScrollLayer` | Interpolate subject, UI panels, oversized titles, foreground props |
| `ScrollDepthImage` | Render generated images, poster frames, video loops, ping-pong loops, 3D hover tilt |
| `useMouseSpring` | Subtle pointer drift on decorative foreground elements |
| `useTilt3D` | Tactile hover on hero cards and glass panels (non-touch only) |

## Default deliverables (Mode B)

1. `README.md` with setup instructions.
2. `app/page.tsx`, `app/layout.tsx`, `components/EditionsPage.tsx`, `components/ChapterScene.tsx`, `components/ChapterDemoVisual.tsx`, `components/SmoothScrollProvider.tsx`.
3. `lib/editions-manifest.ts`, `lib/use-lenis.ts`, `lib/use-device.ts`.
4. `lib/fal-client.ts`, `lib/fal-models.ts`, `lib/fal-generate.ts`, `lib/prompt-contract.ts`.
5. `app/api/fal/proxy/route.ts` (hardened with `PUT` + `allowedEndpoints`).
6. `app/api/fal/webhook/route.ts` for queue-mode callbacks.
7. `app/api/generate-edition-asset/route.ts` supporting `mode: 'sync' | 'queue'`.
8. `scripts/generate-chapter-assets.mjs` (batch, `--dry-run`/`--only`/`--model`) + `scripts/setup.mjs` (key wizard).
9. `app/globals.css`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`, `package.json`, `.env.example`.
10. A QA checklist with exact commands.

## Anti-patterns — do NOT use Mode B for

- "Build a basic hero + features + pricing landing page."
- "Generate a WordPress theme."
- Ordinary SaaS landing pages, CRUD dashboards, or simple brochure sites — unless the user explicitly asks for a cinematic / editorial treatment.
- "Regenerate all templates from scratch without reading bundled files."
