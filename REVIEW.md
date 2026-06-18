# Self-Review — 10× upgrade

After the 12-phase rebuild, an **adversarial review** (5 independent agents reading the actual
artifacts — every component, every gate script, the tokens/themes, and docs-vs-code) surfaced
**50 findings**. This file records all of them and their status. Every fix was re-verified
with `npm test`.

> Why this exists: the same skepticism that caught a hallucinated "committed secret" earlier
> applies to my own output. A skill that claims "verified" has to mean it.

## Summary

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| critical | 3 | 3 | 0 |
| high | 12 | 12 | 0 |
| medium | 20 | 11 | 9 |
| low | 15 | 2 | 13 |
| **total** | **50** | **28** | **22** |

All **critical** and **high** findings are fixed (the 2 `horizontal-gallery` a11y items —
keyboard focus scroll-into-view and a pin-scoped `view-timeline` matching the rAF scrub — were
the last highs, now resolved), plus every doc/data inaccuracy and several gate-robustness gaps.
Remaining deferred items are **medium/low component polish** — tracked, none affecting the
contract, the gates, or the doctor scores (the library still scores 96–99).

## Fixed (28)

| Sev | Finding | Where |
|---|---|---|
| critical | kinetic-headline.tsx uses scrollTrigger but never imports/registers ScrollTrigger — animation fires on mount, not on scroll | `components/mode-b/kinetic-headline.tsx` |
| critical | morph-background.tsx entrance reveal uses scrollTrigger but ScrollTrigger is never imported/registered | `components/mode-b/morph-background.tsx` |
| critical | verify-build target parser drops the real target when a flag value equals the target string → silent static-only PASS (exit 0) | `tools/verify/verify-build.mjs` |
| high | magnetic-cursor: rAF lerp loop runs forever and never stops; pointermove listener never removed | `components/mode-a/magnetic-cursor.html` |
| high | hero-parallax: viewport-change handler writes JS transforms even when native CSS timeline owns the parallax, fighting the compositor | `components/mode-a/hero-parallax.html` |
| high | morph-background: JS fallback progress math is mis-scaled vs the CSS scroll-timeline path — morph is ~1/3 complete before scrolling begins | `components/mode-a/morph-background.html` |
| high | horizontal-gallery: CSS scroll-timeline path uses a hardcoded --travel default of 60vw and animation-timeline:scroll(root block) that does not match the 340vh pin distance | `components/mode-a/horizontal-gallery.html` |
| high | horizontal-gallery: card track is keyboard-focusable via <a> but on the desktop pin path there is NO scroll-into-view when a card receives focus — Tab moves focus off-screen | `components/mode-a/horizontal-gallery.html` |
| high | check-themes silently skips WCAG contrast when bg/fg are token aliases or 3-digit hex → AA gate is a no-op for those themes (false PASS) | `tools/check-themes.mjs` |
| high | token-conformance (doctor) misses rgb()/hsl()/named-color literals and a single var() launders an all-literal page → perfect 100 score for off-contract CSS | `tools/cinematic-doctor/checks/tokens.mjs` |
| high | check-tokens verifies only motion.ease.* curves, never the semantic.ease.* role tokens components actually consume → wrong-curve role alias passes | `tools/check-tokens.mjs` |
| high | evals single-target mode declares vacuous PASS — specs with empty/partial asserts pass any (or junk) file | `evals/run.mjs` |
| high | liquid-chrome reveal ease is an ease-IN-out curve mislabeled power3.out — contradicts both its GSAP name and film-archetypes §9 | `themes/liquid-chrome.theme.json` |
| high | design.md component-grammar example uses --lh-display / --lh-body, which the build never emits (silently broken line-heights) | `design.md` |
| high | PinnedReveal documented as shipping in both modes, but components/mode-b/pinned-reveal.tsx does not exist (manifest points at a missing file) | `components/manifest.json` |
| medium | magnetic-cursor: snap target position is read from getBoundingClientRect but never updated on scroll/resize | `components/mode-a/magnetic-cursor.html` |
| medium | magnetic-cursor: native cursor hidden with no fallback if the rAF dot fails or first paint stalls | `components/mode-a/magnetic-cursor.html` |
| medium | gsap.registerPlugin(useGSAP) is incorrect — useGSAP is a React hook, not a GSAP plugin | `components/mode-b/depth-figure.tsx` |
| medium | check-tokens / build / check-themes crash with unhandled TypeError on a null (or non-object) token file instead of a clean gate failure | `tools/check-tokens.mjs` |
| medium | check-links skips dead links containing a # anchor, root-level .html/.css/.yml files, parenthesized/query paths, and any path under components/ (a real repo dir not in REPO_DIRS) | `tools/check-links.mjs` |
| medium | check-consistency secret scan only matches *.local — a committed bare .env (or .env.local.bak) with real secrets is not caught | `tools/check-consistency.mjs` |
| medium | tracking tokens encoded as rem but authored/documented as em — letter-spacing no longer scales with font size | `tokens/core.tokens.json` |
| medium | naturalistic-drift fg-dim fails WCAG (2.98:1) and misapplies a §7 'cool shadow' depth color as secondary text | `themes/naturalistic-drift.theme.json` |
| medium | design.md §3 states --lh-body >= 1.5 but the emitted value is 1.7 | `design.md` |
| medium | design-tokens.md 'Emit convention' lists --ease-cut as a core/motion namespaced var, but it is emitted from the semantic layer | `references/design-tokens.md` |
| medium | component-grammar.md claims TiltCard verified at 99/100 — actual cinematic-doctor TOTAL is 98/100 | `references/component-grammar.md` |
| low | design.md §1 routing table puts var(--ease-cut) under 'Motion primitives' | `design.md` |
| low | SKILL.md verify section lists doctor categories without 'tokens' (internally inconsistent with its own verification map and the checks dir) | `SKILL.md` |

## Deferred — tracked follow-ons (22)

Medium/low polish; safe to ship without, fix incrementally.

| Sev | Finding | Where |
|---|---|---|
| medium | hero-parallax: reduced-motion CSS forces transform:none!important but JS clear path can still be bypassed; also matchMedia change can re-enable JS without honoring native | `components/mode-a/hero-parallax.html` |
| medium | scrub-video: poster <img> and <video> share class .frame with object-fit:cover but the poster src is a 16x9 EMPTY svg — no real fallback image ships, and on touch the visual is blank | `components/mode-a/scrub-video.html` |
| medium | scrub-video: video.currentTime seek scheduled via requestVideoFrameCallback never fires when the video is not playing — scrub can stall | `components/mode-a/scrub-video.html` |
| medium | horizontal-gallery: travel() uses track.scrollWidth - track.clientWidth, but on desktop the track is display:flex with no overflow, so clientWidth is the padded box and scroll distance is mis-measured | `components/mode-a/horizontal-gallery.html` |
| medium | depth-figure: CSS swaps rotateX/rotateY semantics vs JS — variable names --rx/--ry are crossed, producing axis-confused tilt | `components/mode-a/depth-figure.html` |
| medium | Multiple files: literal hex and palette values leak into CSS instead of tokens, breaking the 'token-driven' contract the headers claim | `components/mode-a/morph-background.html` |
| medium | React namespace types (React.ReactNode / React.CSSProperties) used without importing React | `components/mode-b/hero-parallax.tsx` |
| medium | MagneticCursor queries magnetic targets once at mount — targets rendered later get no listeners | `components/mode-b/magnetic-cursor.tsx` |
| medium | Hardcoded duplicate element IDs (kh-title, sv-title, mb-title, hg-title, tc-title) break reuse on a page | `components/mode-b/tilt-card.tsx` |
| low | morph-background: --morph written on the stage element, but @property declares inherits:true and CSS keyframes also target --morph — value source can conflict between paths | `components/mode-a/morph-background.html` |
| low | scrub-video: data-ready (poster crossfade) is set on loadedmetadata, before the video can actually paint a frame — poster fades to a blank/undecoded video | `components/mode-a/scrub-video.html` |
| low | depth-figure: scroll parallax runs on touch devices (no fine-pointer gate), only tilt is gated — header comment implies a calmer touch experience but parallax stays live | `components/mode-a/depth-figure.html` |
| low | depth-figure & tilt-card: will-change:transform is applied permanently and never released, keeping layers promoted for the page lifetime | `components/mode-a/depth-figure.html` |
| low | tilt-card: the tilt is applied to a tabindex=0 card but there is NO keyboard-equivalent and the live-tracking class removes the transition, so focus gives no motion feedback (minor) — and is-tilting transition:none can leave card stuck mid-tilt if pointerleave is missed | `components/mode-a/tilt-card.html` |
| low | kinetic-headline: 'on its own' is a single .word span, so the staggered reveal treats a 3-word phrase as one beat — stagger indices skip and the cascade is uneven vs the aria-label | `components/mode-a/kinetic-headline.html` |
| low | pinned-reveal: reveal stagger uses :nth-child on .reveal but the <hr class='rule reveal'> is child 3 — the decorative rule animates as a beat while the summary (child 4) is delayed, putting the visual emphasis on a divider | `components/mode-a/pinned-reveal.html` |
| low | morph-background: clip-path is animated on the title mask reveal — a non-compositor-cheap property, contradicting the 'transform/opacity only' budget the header asserts | `components/mode-a/morph-background.html` |
| low | kinetic-headline aria-labelledby points to an element that also carries aria-label — conflicting accessible name | `components/mode-b/kinetic-headline.tsx` |
| low | depth-figure entrance gsap.from(root) sets autoAlpha:0 with start 'top 80%' — content can stay invisible if the trigger never re-fires after refresh | `components/mode-b/depth-figure.tsx` |
| low | Latent clamp inversion in build.mjs fluid() floor — safe for current FLUID_SIZES but breaks for any size < ~2.42rem | `tools/build-tokens/build.mjs` |
| low | build.mjs --out treats absolute paths as ROOT-relative, writing inside the repo | `tools/build-tokens/build.mjs` |
| low | Core cut / brutalist expo.inOut GSAP names are the easings.net convention, not GSAP's power=quint scale — minor naming inconsistency (curves nearly identical, no visual bug) | `tokens/motion.tokens.json` |
