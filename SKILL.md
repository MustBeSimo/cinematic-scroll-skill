---
name: cinematic-scroll
description: Build cinematic scroll-driven, 3D-tilt, parallax, and environment-morphing websites — pinned chapter reveals, hero parallax, depth-image figures, hover-tilt cards, background-morphing layouts, release/launch pages, product story pages, or editorial commerce microsites. From a single self-contained scroll section (Mode A) to a full Shopify-Editions-style Next.js release site with optional AI-generated visuals via the fal.ai remote API (Mode B — requires your own fal.ai key; makes outbound API calls to fal.ai). Includes an optional audit mode in which the agent analyzes a user-supplied URL using its own browser/fetch access and scores the scroll experience on 4 dimensions (Pacing, Performance, Accessibility, Emotional Arc). Works through an optional 5-phase pipeline (cinematic audit → motion storyboard → technical spec → build → polish) with taste guardrails, 12 proven scroll patterns, 11 visual systems, and a transform/opacity performance budget as built-in craft constraints. Advanced capabilities are user-initiated, not absent: WebXR/AR sessions are feature-gated and only start on an explicit user action (an Enter VR/AR button that appears solely when the device reports support), and 3D GLB generation lives in the Mode B Next.js template (`templates/nextjs/scripts/generate-flagship-assets.mjs`, run with your own fal.ai key) — see activation guidelines below.
version: 2.5.1
author: Simone Leonelli
license: MIT
metadata:
  hermes:
    tags: [Animation, Frontend, Design, 3D, Motion, GSAP, Parallax, WebGL]
    related_skills: []
permissions:
  - filesystem:read     # read project files to audit and build cinematic layouts
  - filesystem:write    # create and modify HTML, CSS, TypeScript, and asset files
  - network:fetch       # (a) call fal.ai remote API to generate images/3D GLB assets — optional, user-initiated, requires FAL_KEY; (b) fetch a user-supplied URL in audit mode — optional, user-initiated; (c) generated pages load pinned third-party CDN assets at runtime in the browser (GSAP + three.js from cdn.jsdelivr.net; three.js Draco decoder + @google/model-viewer from unpkg.com; Google Fonts) — self-host to avoid; all disclosed in manifest.json → security.thirdPartyNetworkCalls
  - shell:execute       # run npm/node scripts (setup, generate, typecheck, build) and the local page-proof tool (Playwright) for headless page screenshots — all optional, user-initiated
  - env                 # read FAL_KEY / FAL_IMAGE_MODEL for fal.ai generation and CHROME_PATH / PLAYWRIGHT_BROWSERS_PATH to locate a local browser (all optional, user-initiated)

# Context isolation: this skill acts only on content, files, and credentials supplied
# in the CURRENT session — it never accesses, recalls, or acts on data from previous
# sessions or other users, and FAL_KEY/credentials must be given explicitly here,
# never inferred from memory or prior context. Two deliberate, user-initiated network
# exceptions are disclosed below (and in manifest.json → security.thirdPartyNetworkCalls):
# (1) audit mode fetches the user-supplied URL via the agent's OWN browser/fetch — only
# sites the user owns or is authorized to test; (2) generated pages load pinned
# third-party CDN assets (GSAP, Google Fonts, three.js/Draco, @google/model-viewer) when
# opened in a browser — self-host these if your deployment policy requires it.

# Activation: invoke this skill when the user asks to BUILD or AUDIT a
# cinematic/scroll/parallax/3D-tilt website, launch page, or editorial microsite,
# OR asks to review or score an existing URL's scroll experience.
# Do NOT activate for: generic landing pages, CRUD apps, forms-based workflows,
# CMS integrations, dashboards, or any request that does not explicitly involve
# scroll-driven motion or cinematic web design.
# Motion-heavy defaults apply only within this skill's output. If the user requests
# minimal animation or a static fallback, respect that preference without requiring
# justification.
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

Reusable patterns + production templates for building cinematic, scroll-driven
React pages: pinned chapters, multi-depth parallax, 3D mouse tilt,
environment-morphing backgrounds, reduced-motion-safe degradation, and
(optionally) a full Next.js release site with fal.ai-generated visuals.

This is v2.0 — built on a **5-phase pipeline** that is *adaptively* gated (see
"Match the gating to the ask" below). Every phase produces a reviewable artifact:
the user approves each phase before the next **when they want the process or the
brief is ambiguous**, and the agent runs straight through **when handed a complete
brief or asked for a result directly** (still emitting every artifact). This
replaces the v1.0 one-shot model with a process that consistently produces
production-quality output.

## Agent quickstart — route, act, verify

Read this section first; read the rest as the route demands. Three rules:

**1 · Route the request.** Match what the user asked for and go straight to work:

| Request shape | Do this | Read first |
|---|---|---|
| "a scroll section / hero / one-pager" | **Mode A**: one self-contained `.html` (GSAP + ScrollTrigger via pinned CDN + SRI). Start from the closest `examples/*` page. | Phase 4 Mode A rules · `taste-guardrails.md` |
| "a release site / product launch / multi-chapter story" | **Mode B**: copy `templates/nextjs/` verbatim, then art-direct. | Phase 4 Mode B rules · `templates/nextjs/FLAGSHIP.md` |
| "3D / WebGL / WebXR / 'like the flagship'" | Mode A → adapt `examples/flagship/` (vanilla three, manifest-driven GLBs, FX layer). Mode B → the `/flagship` route (`templates/nextjs/FLAGSHIP.md`). Generate real meshes: `npm run generate:flagship -- --apply` (needs `FAL_KEY`). | `references/3d-stack.md` · `ASSETS-3D.md` |
| "a launch film / video of the site" | Compile the same choreography to video: `node compile-choreography.mjs scene.json --target video`, or author HyperFrames/Remotion directly in `video/`. | `FRAME.md` · `video/PIPELINE.md` |
| "score / review an existing URL's scroll experience" | **Audit mode**: analyze the user-supplied URL (only sites they own or are authorized to test) and score Pacing / Performance / Accessibility / Emotional Arc, then emit a remediation plan. | `audit-mode.md` |
| "audit / improve a page I'm building" | Run the doctor first, fix what it flags, re-run; pair with the verify orchestrator. | `tools/cinematic-doctor/README.md` · `tools/verify/README.md` |
| "avatar walkthrough / HeyGen video of the site" | Capture scroll frames + optional fal.ai sticker cutouts → HeyGen avatar-narrated walkthrough. Run `node tools/heygen/generate-walkthrough.mjs <page>` to produce the payload, then fire via HeyGen MCP or API. | `tools/heygen/README.md` |
| "an immersive brand world / 'constant wow' / world-building / make it look like the reference" | Run **Phase 1.5 Asset Direction** before the storyboard — design the world premise, hero concept, motif system, material language, and per-asset sourcing; then clear the **Wow Gate** (reject generic *before* building). | `references/asset-direction.md` · `references/wow-gate.md` |
| "Awwwards-tier / image distortion / kinetic type / custom cursor / preloader / page transitions" | The five second-generation techniques, each with its degrade contract; all five live in `examples/atelier/`. | `references/awwwards-techniques.md` |

**1b · Speak the design contract.** Before emitting any CSS/TS, resolve every
color, type size, spacing value, easing curve, and pin height through a token —
never a literal. The readable map is [`design.md`](design.md); the machine source
is [`tokens/`](tokens/) (DTCG: `core` primitives, `motion`, `semantic` roles).
Components/chapters reference semantic role vars only (`--bg`, `--accent`,
`--ease-reveal`); a visual-system swap is one `themes/*.theme.json`. Verify the
contract with `npm run tokens:check`. Full reference: `references/design-tokens.md`.
Reusable, doctor-verified building blocks (HeroParallax, PinnedReveal, DepthFigure,
TiltCard, MorphBackground, HorizontalGallery, ScrubVideo, KineticHeadline,
MagneticCursor) live in `references/component-grammar.md` + `components/` (Mode A
html + Mode B tsx) — start from these instead of writing motion from scratch.

**2 · Match the gating to the ask.** The 5-phase pipeline below produces an
artifact per phase. When the user wants the *process* (or the brief is genuinely
ambiguous), gate each phase on their approval as written. When the user asked for
a *result* ("build me…", one-shot, CI, or another agent invoked you), run the
phases internally without pausing, still emit the artifacts (`cinematic-audit.md`,
`motion-storyboard.md`, `technical-spec.md`, `polish-report.md`) as the audit
trail, and replace human gates with the verify loop below. Never block an
autonomous run waiting for approval the user can't give.

**3 · Verify before you call it done — every time.**

```bash
node tools/cinematic-doctor/cli.mjs <your-page>.html   # 0–100; exits non-zero < 80
```

Fix what it flags and re-run until it passes — the same gate CI enforces. The
doctor scores taste, performance, a11y, mobile, tokens, and 3D; its findings reference
the exact guardrail sections to read. For Mode B also run `npm run typecheck`
and `npm run build` in the project.

The doctor grades the static contract; pair it with the runtime half:

```bash
npm run proof -- <url-or-file>          # tools/page-proof — headless run +
                                        # console errors + scroll screenshots
```

`page-proof` opens the page in headless Chromium, scrolls it, collects every
console error / uncaught exception / failed request, and writes screenshots at
each depth (`.page-proof/proof.json` + shots). Exit 1 means runtime errors —
fix and re-run. Add `--fps` on DOM pages to measure scroll smoothness (avg fps
+ dropped-frame share — the §1 transform/opacity budget, measured, not
asserted). Needs `playwright-core` + any Chrome (`--wait 8000` for WebGL).

**Then LOOK at the shots — this step is not optional.** You can read images:
open every screenshot page-proof wrote and grade the frame like a director
reviewing dailies, against `taste-guardrails.md`:

- **Composition** — is there a clear focal point at every depth, or dead/empty
  frames mid-scroll? (A dwell with nothing composed in view is a failed shot.)
- **Hierarchy** — does the type read in order (eyebrow → display → body)?
  Any title colliding with imagery or another overlay?
- **Reveal state** — are entrance animations finished or stuck half-way
  (clipped masks, 0-opacity text that never arrived)?
- **Canvas truth** — for WebGL: is the scene actually rendering, or is it a
  black/empty canvas behind healthy-looking DOM?
- **Edges** — stretched or wrongly-cropped media, horizontal overflow,
  elements pinned off-screen.

Anything you would screenshot-and-complain-about as a user, fix and re-prove.
A build is done when the doctor passes, proof exits 0, AND the shots would
survive an art director's review.

**Verification map** — four surfaces, each answers a different question:

| Question | Use | Command |
|---|---|---|
| Is an *existing URL's* scroll experience any good? | `audit-mode.md` (4-dimension score + remediation) | agent-driven |
| Does *my static build* clear the craft bar? | `cinematic-doctor` (taste/perf/a11y/mobile/tokens/3D) | `npm run doctor -- <file>` |
| Does it *run* without errors / jank? | `page-proof` (headless run, console, shots, fps) | `npm run proof -- <file>` |
| Prove a whole phase at once (contract + doctor + runtime + Mode B) | `verify-build` orchestrator | `npm run verify -- <target>` |

The contract itself: `npm run tokens:check · themes:check · links:check · evals:run`, or all gates via `npm test`.

---

## The aesthetic is the user's — the motion is yours

**This skill supplies the *motion grammar*, never a fixed look.** The pinned
chapters, parallax, tilt, title choreography, and morphing backgrounds are the
constant; the visual world — palette, typography, imagery, mood — comes entirely
from the user's brief. Derive the aesthetic from what they ask for (brand,
references, palette, vibe, or a visual system from `references/film-archetypes.md`).
If they haven't said, **ask** or offer 2–3 distinct directions — never default to
any one style. The same machinery must produce a brutalist black-on-white drop, a
quiet-luxury launch, a neon Gen-Z page, a sci-fi noir reveal, an organic wellness
story, or a Renaissance editorial. None is "the" style. The five public examples
(`examples/renaissance`, `examples/studio`, `examples/noir`, `examples/luxe`, `examples/pop`)
are *different* worlds from the same engine — proof the look is a variable, not a default.

---

# Philosophy

## 1. Taste is non-negotiable

The difference between slop and craft is anti-convergence. This skill ships
with `taste-guardrails.md` — 11 banned patterns, a cinematic vocabulary,
pacing rules, and anti-convergence principles. These are the skill's default
**craft constraints** (anti-slop quality, not a forced aesthetic or locale): the
user's explicit preferences always win — palette, tone, intensity, language, or a
minimal/static fallback are theirs to set. Absent such direction, an agent that
skips these guardrails produces tasteless output regardless of prompt quality, so
every generated file is checked against the banned-patterns list before delivery.

## 2. Process over prompt

A great prompt is not enough. The 5-phase gated pipeline ensures that
**auditing**, **planning**, **specifying**, **building**, and **polishing**
happen as discrete, reviewable steps. The user sees a `cinematic-audit.md`
before any code is written. They approve a `motion-storyboard.md` before
any animation is implemented. Process de-risks the output.

## 3. Film grammar over web patterns

Scroll is not "web design." It is **digital cinematography**. The cinematic
vocabulary in `taste-guardrails.md` (Section 2) maps 12 film techniques to
scroll equivalents — dolly zooms, whip pans, rack focus, tracking shots,
crane shots. Every scroll behavior names the film technique it implements.
This is how we produce cinema, not PowerPoint transitions.

## 4. Measurable quality

Every output has reviewable artifacts. Every phase has a decision gate.
Every build is checked against `performance-budget.md` (Section 6, 11-point
pre-launch checklist). Quality is not a feeling — it is a checklist.

---

# The 5-Phase Pipeline

Each phase produces a reviewable `.md` artifact. Gating is **adaptive** (see the
quickstart's "Match the gating to the ask"): when the user wants the process or the
brief is ambiguous, the user reviews and approves each phase before the next; when
the user asked for a direct result (a complete brief, one-shot, CI, or another agent
invoked this skill), the agent runs the phases internally without pausing and still
emits every artifact as the audit trail. The agent never silently drops a phase's
artifact.

---

## Phase 1: Cinematic Audit

**Purpose:** Analyze the brand/content, define the emotional arc, select
the visual system, and establish the motion personality.

| | |
|---|---|
| **Input** | User's brief, brand materials (palette, logo, copy), reference sites, target audience, device context |
| **Output** | `cinematic-audit.md` |
| **Decision gate** | User approves the emotional arc and visual system before proceeding |

### Agent instructions

1. Ask the user about their brand's motion personality if not provided:
   - "What emotion should the first 3 seconds produce?"
   - "Is your brand closer to a Symmetric Monument (meticulous, formal) or a Warm Scrapbook (intimate, playful)?"
   - "Who is scrolling this — a curious visitor or a decision-maker?"

2. Select a **visual system** from `references/film-archetypes.md`.
   Read the archetypes file (Section 1-7) and match the brief to ONE primary
   visual system. Document the choice in the audit with rationale. Never mix more
   than 2 visual systems; if hybridity is needed, choose one primary and one accent.

3. Define the **emotional arc** across the full scroll journey:
   - Opening emotion (what the user feels at scroll position 0)
   - Mid-journey turning point (where the narrative shifts)
   - Closing emotion (what the user carries away)
   - Pacing rhythm: glacial / medium / energetic / variable

4. Document:
   - Brand motion personality (3-5 adjectives)
   - Emotional arc definition (opening → midpoint → closing)
   - Audience analysis (device split, technical sophistication, attention span)
   - Device context (primary viewport, performance tier expectation)
   - Accessibility requirements (reduced-motion needs, WCAG target)
   - Visual system selection (primary + optional accent, with rationale)
   - Color temperature progression across chapters (warm → cool → neutral)
   - Typography strategy (display font + body font, from archetype)

### Output: `cinematic-audit.md`

→ Full template: [`references/artifact-templates.md`](references/artifact-templates.md). Copy the **cinematic-audit.md** section and fill every field.

## Phase 1.5: Asset Direction — the world before the layout

**Purpose:** Decide the *physical world* the brand lives in and where every visual comes
from — so the build can't drift into a generic dark-landing-page. This is the module that
makes **wow reproducible** instead of occasional. Required for any *release · launch ·
immersive · premium · flagship · "wow"* brief; skippable only for a single utilitarian section.

| | |
|---|---|
| **Input** | `cinematic-audit.md` |
| **Output** | `art-direction.md` (world premise · hero concept · motif system · material/light language · per-asset sourcing · signature moment) |
| **Decision gate** | **The Wow Gate** — Hero Concept Gate (hard pass/fail) + Wow Rubric (≥ 8/12). A failed concept is regenerated *before* any code is written; never build a generic hero because the prompt was thin. |

Read **[`references/asset-direction.md`](references/asset-direction.md)** (the five decisions +
the coherence rule) and **[`references/wow-gate.md`](references/wow-gate.md)** (the gate). The
storyboard (Phase 2) then makes every chapter carry ≥1 motif, and the polish phase (Phase 5)
verifies the **signature moment** survived in the page-proof frames — paired with
`cinematic-doctor`, which scores the executed contract. Doctor = "not slop"; Wow Gate =
"actually memorable."

→ Artifact template: [`references/artifact-templates.md`](references/artifact-templates.md), the **art-direction.md** section.

## Phase 2: Motion Storyboard

**Purpose:** Plan the scroll sequence — chapters, patterns, transitions,
depth layers, timing, and mobile degradation.

| | |
|---|---|
| **Input** | `cinematic-audit.md` |
| **Output** | `motion-storyboard.md` |
| **Decision gate** | User approves the chapter structure and pattern choices before proceeding |

### Agent instructions

1. Design a **chapter breakdown** of 5-8 chapters. Each chapter is one
   pinned section with a distinct visual world. The total scroll distance
should be 1500-3000vh for the full experience.

2. Select **ONE pattern from `references/scroll-patterns.md` per chapter**.
   The 12 available patterns (Section 1-12) are:
   - Pinned Hero, Scrubbed Timeline, Velocity-Reactive, Sticky Narrative,
     Chaptered Release, Parallax Gallery, 3D Product Orbit, Editorial Longread,
     Data Story, Landing Sequence, Portfolio Reveal, Archive Explorer.
   Document the pattern choice and rationale for each chapter.

3. Ensure **no adjacent chapters use the same pattern or transition type**.
   This is a hard rule from `taste-guardrails.md` Section 4.4. Alternate:
   fade → slide → scale → rotate → crossfade → wipe.

4. Configure **depth layers per chapter** following the selected pattern's
   depth configuration. Reference `taste-guardrails.md` Section 4.3: never
repeat a depth multiplier between adjacent chapters. Maximum 7 layers per
chapter (`taste-guardrails.md` Section 1.7).

5. Verify **all pinned sections respect the 150-400vh rule** from
   `taste-guardrails.md` Section 3.2 and 3.3. No pin shorter than 150vh,
no pin longer than 400vh.

6. Ensure **breathing room between chapters**: minimum 80vh of free-scroll
   space between pinned chapters (`taste-guardrails.md` Section 3.4).

7. Specify the **title reveal style per chapter**, rotating through the
   vocabulary in `taste-guardrails.md` Section 4.5. Never use the same
treatment twice in a row.

8. Document the **mobile degradation plan** per chapter using the tier
   system from `performance-budget.md` Section 3.

### Output: `motion-storyboard.md`

→ Full template: [`references/artifact-templates.md`](references/artifact-templates.md). Copy the **motion-storyboard.md** section and fill every field.

## Phase 3: Technical Spec

**Purpose:** Output the Lenis/GSAP/ScrollTrigger implementation plan with
exact configs, performance budget allocation, and asset requirements.

| | |
|---|---|
| **Input** | `motion-storyboard.md` + `references/performance-budget.md` |
| **Output** | `technical-spec.md` |
| **Decision gate** | User confirms the tech stack and approves performance budget before proceeding |

### Agent instructions

1. **Select packages:**
   - Smooth scroll: Lenis (`lenis` npm package — NOT `@studio-freight/lenis`)
     OR GSAP ScrollSmoother (preferred when GSAP is already in the build)
   - Animation: GSAP + ScrollTrigger + SplitText (all now free)
   - Motion primitives: `choreo-3d` for pinning orchestration
   - Framework: React 19 + Next.js App Router (Mode B) or vanilla (Mode A)

2. **Specify exact GSAP ScrollTrigger configs** for every pinned chapter:
   - `scrub` value (0.3-0.8 range per `performance-budget.md` Section 7)
   - `start` and `end` positions
   - `pin` configuration
   - `snap` behavior if applicable
   - Easing functions per role (hero entrance, exit, micro-interaction,
     chapter transition — from `taste-guardrails.md` Section 4.1)

3. **Allocate performance budget** from `performance-budget.md`:
   - Layer count per viewport (max 10 desktop, 4 mobile — Section 2)
   - will-change strategy (Section 2)
   - Image budget per chapter (Section 5)
   - Font budget (Section 5)
   - JS budget (Section 5)

4. **Flag any performance risks:** If the storyboard requests more than
   7 layers per chapter, more than 3 simultaneous motion types in a 50vh
window, or pins approaching the 400vh limit, flag it here with mitigation.

5. **Document asset requirements:** Images, videos, fonts, with specifications
   for each (format, dimensions, generation prompts if using fal.ai).

6. **Specify mobile degradation implementation** per chapter, referencing
   `performance-budget.md` Section 3 (Mobile Degradation Matrix).

7. **Select the 3D / shader stack tier** (see block below) and **declare the
   chosen tier in the technical spec**. Default is Tier A (no 3D). Every step up
   must be justified by a named narrative need, not a vibe.

### 3D / Shader Stack Selection

3D is the most expensive thing you can put on a scroll page. The default answer
is **Tier A: no 3D.** Earn each step up the ladder with a reason. Pick the
**lowest** tier that satisfies the narrative — climbing a tier multiplies cost
(bundle, GPU memory, battery, asset-production time, failure surface). Read
`references/3d-stack.md` and `references/webxr.md` before specifying any 3D.

```
Does the story actually need real 3D depth / rotation / parallax-in-space?
│
├─ NO  ──────────────────────────────────────────►  TIER A  (GSAP / CSS only)
│       Fake depth with layered transforms + CSS 3D. 95% of cinematic
│       scroll pages live here. (scroll-patterns.md #1, #6, #7.)
│
└─ YES → Do you have (or can you commission) a real model?
         │
         ├─ YES, a discrete object/scene/figure  ──►  TIER B  (Three + GLB)
         │        A product, an environment, an avatar. Asset-driven.
         │
         └─ NO model — the visual IS the math  ─────►  TIER C  (Three + shaders)
                  Fields, flows, particles, generative surfaces. Zero assets.

         …and on top of B or C, only if a flat screen genuinely cannot deliver
         the moment (scale / presence / embodiment):
                                          ──────────►  TIER D  (+ WebXR)
                  Immersive VR / room-scale AR. (references/webxr.md.)
```

- **Tier A — GSAP / CSS only.** The depth is illusory and a screen is the final
  medium. The "3D Product Orbit" pattern is CSS `rotateY` on layered images, not
  a mesh. If you cannot name a specific thing the user *does* that requires a
  camera moving through real geometry, stay here.
- **Tier B — GSAP + Three.js + GLB.** A discrete hero artifact whose form
  carries the story and that the user orbits / inspects / configures, or a place
  the camera flies through. Requires the GLB (or a committed path to it) plus the
  `ASSETS-3D.md` hand-off and a manifest.
- **Tier C — GSAP + Three.js + procedural shaders.** The visual *is* the
  computation — a field, flow, surface, or particle system with no object to
  model. Zero external assets; this is the procedural backbone (and the
  fallback every Tier-B chapter degrades to).
- **Tier D — any of B/C + WebXR.** Flatness is the actual limitation (scale,
  presence, embodiment). XR is a session the user explicitly enters; never the
  default render path. The 2D page must be complete on its own.

**Pin every renderer version exactly — no `latest`, no floating majors.**
Three.js makes breaking changes between minors; an un-pinned 3D stack is a
future blank chapter. Pin vanilla Three to an exact patch (`three@0.160.0`) via
a versioned CDN import map; pin Three exactly in package builds (caret only on
the R3F wrappers, lockfile freezes the tree). Full pin table and import map in
`references/3d-stack.md` Section 2.

**Declare the stack tier in the technical spec** (the table in the output
template). State the chosen tier, the named narrative need that justifies it,
and the pinned versions. If two tiers both satisfy the story, ship the lower
one — "could be 3D" is not "should be 3D." Full decision criteria, performance
caps, fallback rules, and the scroll-camera pattern: `references/3d-stack.md`.
WebXR session setup, comfort/safety, and AR quick-look: `references/webxr.md`.

### Output: `technical-spec.md`

→ Full template: [`references/artifact-templates.md`](references/artifact-templates.md). Copy the **technical-spec.md** section and fill every field.

## Phase 4: Build

**Purpose:** Generate the code.

| | |
|---|---|
| **Input** | `technical-spec.md` |
| **Output** | Mode A (self-contained HTML) or Mode B (Next.js project) |
| **Decision gate** | Implicit — the code IS the deliverable |

### Agent instructions

1. **Apply ALL taste guardrails as hard constraints.** Before delivering,
   check every output against the banned patterns list in
`taste-guardrails.md` Section 1. Violating these rules is a bug, not a
style choice.

2. **Ensure reduced-motion fallback** for every scroll-driven effect.
   When `prefers-reduced-motion: reduce` is active: disable pinning, disable
parallax, show static compositions, set all transitions to instant.
Reference `performance-budget.md` Section 3, Tier 4.

3. **Give mobile a touch-safe cinematic experience — not a dead page.** Below
   768px, unpin every chapter and stack the layout, BUT keep motion
*scroll-coupled*: a lerped/damped image parallax (one transform-only mover per
section) plus scroll-linked entrance reveals (transform + opacity). A flat,
motionless mobile page is a failure mode for this skill. Drive it with JS
(rAF reading `scrollY` in Mode A, framer `useScroll`/`useSpring` in Mode B) —
never CSS `animation-timeline`, which iOS Safari reports as supported but does
not actually run. No pinning/scroll-jacking on touch, no 3D tilt on touch.
Reference `references/mobile-motion.md` for the recipe and
`performance-budget.md` Section 3 (Mobile Degradation Matrix).

4. **Name the cinematic technique in code comments.** Every scroll-driven
   animation should carry a developer comment identifying the film technique it
   implements (from `taste-guardrails.md` Section 2). This is a code-comment
   convention for maintainers — it does not dictate the page's user-facing
   language or locale, which follow the user's request.

5. **Only animate `transform` and `opacity` in hot scroll paths.** Never
   `width`, `height`, `top`, `left`, `filter`, `box-shadow`.
Reference `performance-budget.md` Section 1 (Permitted Properties).

6. **Use `will-change` strategically** — 200ms before animation starts,
   200ms after it ends, max 3 simultaneous elements. Never globally.
Reference `performance-budget.md` Section 2.

7. **Optional accelerator — compile from a choreography document.** If the
   technical spec is expressed as a `scroll-choreography.json`, run the bundled
compiler to emit the GSAP ScrollTrigger + Lenis code instead of hand-writing it:
`node compile-choreography.mjs my-scene.json --out scene.js`. The compiler maps
the schema's CSS property names to GSAP shorthand (`translateX`→`x`,
`rotateZ`→`rotation`, …) — a mapping that is easy to get wrong by hand and
silently no-ops in GSAP if you do. See `scroll-choreography-compilation.md`.

8. **One choreography, two media.** The same document also compiles to a
   fixed-time video timeline for HTML-to-video renderers (HyperFrames,
Remotion): `node compile-choreography.mjs my-scene.json --target video`.
Scroll progress maps to seconds via FRAME.md §5 pacing; the DOM contract is
identical, so one skeleton serves the page and its launch film. For a complete
render-ready composition in one step, use `--target hyperframes` (emits the
full HTML with real Layer.content rendered; `npx hyperframes render` → MP4).
If the user wants a promo/launch video of the site they just built, this is
the path — see `video/PIPELINE.md` and `FRAME.md`.

8. **Follow the `technical-spec.md` exactly.** Do not improvise animation
   configs that differ from the approved spec.

9. **If using fal.ai assets**, follow the server-side generation pattern,
   never expose `FAL_KEY` in client code. Reference `MODELS.md` for model
selection and cost.

### Mode A vs Mode B

This phase operates in two modes. Follow the mode specified in the
`technical-spec.md`.

| | **Mode A — Scroll artifact** | **Mode B — Full release site** |
|---|---|---|
| Use when | Single section / hero / pinned chapter / parallax demo | Full release / launch / product-story website |
| Output | One self-contained `.html` (inline CSS + JS) or `.tsx` component | Next.js App Router project from `templates/nextjs/` |
| Build step | None | `npm install && npm run dev` |
| AI assets | None (CSS/SVG/static only) | Optional fal.ai pipeline (bring your own key) |
| GSAP | GSAP + ScrollTrigger via a **pinned CDN + SRI** (vanilla rAF fallback for no-CDN sandboxes) | Full GSAP + plugins (now free), via npm |
| Smooth scroll | ScrollTrigger scrub + rAF-throttled handlers | Lenis or ScrollSmoother |

If the request is ambiguous, default to **Mode A** for a single section
and **Mode B** when the user says "site", "page", "release", "launch",
or "landing".

### Mode A build rules

- Single self-contained HTML file: `<!DOCTYPE html>` ... `</html>`, inline
  CSS + JS, renders immediately with **no build step and no npm packages**.
- Load **GSAP + ScrollTrigger from a pinned CDN with SRI** (exact version, integrity
  hash, `crossorigin` — as every `examples/*` page does). **Third-party CDN disclosure:**
  generated Mode A pages load GSAP from `unpkg.com`, fonts from `fonts.googleapis.com`
  / `fonts.gstatic.com`, and `@google/model-viewer` from `cdn.jsdelivr.net`. These
  are outbound network requests made by the browser when the page is opened. If the
  user's deployment policy restricts third-party origins, self-host these assets and
  replace the CDN URLs — mention this proactively. For sandboxes where the CDN is
  unreachable, fall back to `requestAnimationFrame`-throttled scroll handlers:
  identical motion grammar, zero dependencies. Either way there is no bundler and
  nothing to `npm install`. (Lenis is Mode B only.)
- `perspective: 1200px` on chapter wrapper. 3D transforms on at least one
  layer (`rotateX` ±4deg max, `rotateY` ±2deg max).
- Minimum 5 depth layers per chapter.
- Type reveal: use one of mask reveal, word stagger, letter stagger,
  vertical mask, or scrub letter-spacing.
- `clamp()` for all typography. No fixed `px` for `font-size`.
- Progress HUD in top-right for sandbox/iframe environments.
- Reduced-motion check: `prefers-reduced-motion: reduce` → static
  composition, no scroll binding.

### Mode B build rules

- Scaffold from `templates/nextjs/` — copy bundled files **verbatim**.
  Do NOT regenerate `package.json`, `ChapterScene.tsx`, `fal-models.ts`,
`fal-generate.ts`, or API routes from memory. The templates contain
tested, production-safe code.
- `choreo-3d` for motion primitives: `ScrollChoreography`, `ScrollLayer`,
  `ScrollDepthImage`, `ScrollBackgroundMorph`, `useTilt3D`, `useMouseSpring`.
- GSAP plugins (all free): `ScrollTrigger`, `SplitText`, `ScrollSmoother`.
  Register once: `gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother)`.
- `@gsap/react`'s `useGSAP()` hook with a `scope` for cleanup.
- Lenis (`lenis` package — NOT `@studio-freight/lenis`) for smooth scroll.
  Forward Lenis RAF tick to `ScrollTrigger.update`.
- `lib/editions-manifest.ts` — 6-12 chapters, each with: `id`, `eyebrow`,
  `title`, `summary`, `features`, `accent`, `background`, `foreground`,
`poster`, `video`.
- `ChapterScene.tsx` — the 7-layer cinematic scene. Do NOT downgrade it:
  never collapse to 2 layers, never remove `perspective: 1200px`, never
replace word-stagger with plain opacity fade, never drop mobile fallback.
- `lib/fal-models.ts` adapter for all image generation — never inline
  `image_size`, `aspect_ratio`, or `negative_prompt`.
- fal.ai key stays server-side only. Never in client components or `.env`.

### 3D / WebGL / XR build rules (Tier B/C/D only)

These apply **only** when the technical spec declared Tier B, C, or D. Tier A
(GSAP/CSS) ships none of this. `examples/flagship/` is the worked 4-chapter
reference; `references/3d-stack.md` (renderer + caps) and `references/webxr.md`
(Tier D sessions) are the authority. Each rule below is enforceable — a miss is
a bug, not a style choice.

1. **Cap `devicePixelRatio` low for live scenes** — `Math.min(devicePixelRatio,
   isMobile ? 1.0 : 1.5)` (raymarchers/fullscreen shaders can go 0.85–1.3; the
   blur hides it). Uncapped or a flat `2` is a Retina GPU tax — a 4K display
   renders 4–9× the pixels and is the **#1 cause of 3D scroll jank**. **One
   renderer per page** — never a second WebGL context per chapter.
   See `performance-budget.md` §9. *(doctor-enforced)*

1b. **Light budget: ~2–4 dynamic lights — prefer emissive + IBL.** Every
   real-time `PointLight`/`SpotLight`/`DirectionalLight` costs per-fragment on
   every lit mesh; one light per object (e.g. a spotlight per painting) is a
   frame-rate cliff. Get the look from `scene.environment` (an equirectangular
   HDRI via `PMREMGenerator` — image-based fill + real reflections), emissive
   materials/`emissiveMap` for self-lit art, and a couple of camera-following
   lights. Keep MSAA off on fog/fill-heavy scenes. `performance-budget.md` §9.
   *(doctor-enforced)*

2. **Feature-detect WebGL before creating a context.** Probe for a context;
   if it fails, render the **permanent poster / CSS fallback** — never a blank
   canvas. The fallback is a first-class deliverable, not an afterthought.

3. **Handle context loss.** Add a `webglcontextlost` listener that calls
   `e.preventDefault()`, plus a `webglcontextrestored` handler that rebuilds the
   scene. Without `preventDefault()` the context never comes back.

4. **`prefers-reduced-motion: reduce` → render a single static frame.** Draw
   once, then stop. No continuous rAF loop, no auto-rotate, no idle animation.

5. **Gate the rAF loop.** Run frames only when the document is visible
   (`document.visibilityState`) AND the canvas is on-screen (`IntersectionObserver`).
   Stop the loop otherwise. On teardown, **dispose every geometry, material, and
   texture** (and the renderer) — leaked GPU resources accumulate per chapter.

6. **All runtime 3D asset paths come from a manifest** — never hardcode model,
   USDZ, or poster paths in code. Read them from
   `examples/flagship/assets-3d/manifest.json` (shape: `version` (2), `basePath`,
   `chapters.{id}.{label, runtime, iosAr, fallbackPoster, height, lift, spin,
   pivot, cameraNodes, shader, scale, animations, stripRootMotion}` — `runtime`
   is the glb path or `"procedural"`, `iosAr` the optional `.usdz`).

7. **XR (Tier D) is feature-gated.** Check `navigator.xr` and
   `await navigator.xr.isSessionSupported('immersive-vr' | 'immersive-ar')`
   **before** rendering any Enter-VR / Enter-AR button. If unsupported, the
   button never appears. The 2D page must be complete and shippable without XR —
   XR is a session the user explicitly enters, never the default render path.

### Output: Mode A (single file) or Mode B (project directory)

---

## Phase 5: Polish

**Purpose:** Performance audit, accessibility check, mobile verification,
and final quality gate.

| | |
|---|---|
| **Input** | The built code (Mode A HTML or Mode B project) |
| **Output** | `polish-report.md` |
| **Decision gate** | All 11 pre-launch checks must pass. User reviews the polish report. |

### Agent instructions

1. **Run the performance-budget.md monitoring checklist** (Section 6).
   All 11 pre-launch checks must be verified:
   - [ ] Chrome DevTools Performance: 10s scroll recording, < 5% red frames
   - [ ] Lighthouse Performance score > 90
   - [ ] WebPageTest filmstrip: smooth visual progression during scroll
   - [ ] iPhone 12 Safari: no visible stutter during fast scroll
   - [ ] iPhone SE: content accessible, no broken layout on budget tier
   - [ ] Reduced-motion test: all content visible, no broken layout
   - [ ] Battery test: 5min continuous scrolling drains < 3% battery
   - [ ] Memory test: tab memory does not grow > 50MB after 5min scrolling
   - [ ] Layer count: < 10 layers desktop, < 4 on mobile
   - [ ] No layout thrashing: no purple "Layout" bars during scroll
   - [ ] Network: no images load during scroll animation

2. **Verify no banned patterns survived.** Re-check the code against
   `taste-guardrails.md` Section 1 (Banned Patterns).

3. **Confirm emotional arc matches Phase 1 audit.** Scroll through the
   entire experience and verify the emotional progression matches the
`cinematic-audit.md` definition.

4. **Verify all reduced-motion fallbacks.** Test with macOS → Accessibility
   → Reduce Motion ON. All content must be visible and usable.

5. **Verify mobile degradation.** Test at 375px viewport. All pinned
   sections must be converted to stacked layout. No broken tap targets.

6. **Verify accessibility:** All images have meaningful `alt` text (or
   `alt=""` if decorative). All interactive elements have focus states.
`aria-label` on visual navigation controls. Keyboard navigation works.

7. **Measure scroll jank** using the protocol from `performance-budget.md`
   Section 4 (Scroll Jank Measurement Protocol).

8. **3D / XR polish checks (Tier B/C/D only).** Skip for Tier A. Verify:
   - [ ] Context loss tested — force a `webglcontextlost`, confirm
     `e.preventDefault()` fires and `webglcontextrestored` rebuilds the scene.
   - [ ] Fallback verified — disable WebGL (or block the context) and confirm the
     permanent poster / CSS fallback renders, never a blank canvas.
   - [ ] Mobile `devicePixelRatio` lowered (≤ 2, lower on phones) and a single
     renderer is used for the whole page.
   - [ ] No per-frame allocation — no `new` geometries/materials/vectors inside
     the rAF loop; no raycasting or heavy work every frame.
   - [ ] Teardown disposes all geometries/materials/textures (no GPU leak across
     chapters); rAF is gated on visibility + on-screen.
   - [ ] `prefers-reduced-motion` renders a single static frame (no loop).
   - [ ] XR feature-gated — Enter-VR/AR only appears after
     `navigator.xr.isSessionSupported(...)`; the 2D page is complete without XR.
   See `references/3d-stack.md` and `references/webxr.md` for the authority.

9. **Run the cinematic-doctor quality gate — the polish phase is not complete
   until it passes.** Every build SHOULD pass this executable gate before
   shipping:

   ```bash
   npm run doctor -- examples/your-build/index.html
   # equivalently (the gate's direct entry point):
   node tools/cinematic-doctor/cli.mjs examples/your-build/index.html
   ```

   It statically scores the build 0–100 across taste, performance, a11y, mobile,
   tokens, and (when 3D is detected) 3D categories, prints a scorecard, writes
   `cinematic-report.json`, and **exits non-zero below the default threshold of
   80** — so it is CI-blockable / pre-commit-hook ready. Treat a failing score as
   a list of concrete fixes to apply, then re-run until it passes. Do not call
   the build polished while cinematic-doctor is red.

### Output: `polish-report.md`

→ Full template: [`references/artifact-templates.md`](references/artifact-templates.md). Copy the **polish-report.md** section and fill every field.

# Mandatory Motion + Craft Requirements

Every artifact MUST satisfy ALL of these. No exceptions for "demo simplicity"
— the demo IS the product.

## 1. Multi-depth field — minimum 5 layers

Two-layer parallax is amateur. A real depth field uses 5-7 layers at
distinct depth multipliers. Pick at least 5 of these 7 slots:

| Depth | Role | Examples |
|---|---|---|
| 0.15 | Atmospheric far | Sky gradient, distant fog, soft glow |
| 0.30 | Mid-far | Distant props, blurred shapes, horizon |
| 0.50 | Mid | Subject background, atmospheric texture |
| 0.75 | Subject | Main figure / image / 3D object |
| 1.00 | UI text | Title, body copy, eyebrow label |
| 1.20 | Foreground accents | Floating numbers, edge labels, brackets |
| 1.40 | Closest overlays | Cursor highlights, badges, scroll cue |

## 2. 3D perspective camera

Set `perspective: 1200px` on the chapter wrapper. Use scroll-driven 3D
transforms on at least one layer: `rotateX(±4deg max)`, `rotateY(±2deg max)`,
`translateZ(0px → -80px)`. Disable all 3D rotation on touch devices AND
when `prefers-reduced-motion: reduce`.

## 3. Type reveal patterns

Plain `opacity: 0 → 1` on oversized titles is lazy. Use one of:
word stagger, letter stagger, mask reveal (`clip-path: inset`), vertical mask,
scrub letter-spacing. Combine with `translateY()` and `opacity`.

## 4. Smooth scrolling — mandatory in production

- **Mode A:** `requestAnimationFrame`-throttled scroll handlers (not raw
  `scroll` events). No packages — dependency-free by design.
- **Mode B:** Lenis (`lenis` npm — NOT `@studio-freight/lenis`) OR GSAP
  `ScrollSmoother` (preferred when GSAP is already in the build). Forward
Lenis RAF tick to `ScrollTrigger.update` if using both.

## 5. GSAP is now free — use the premium plugins in Mode B

As of the Webflow acquisition (2025), GSAP is 100% free including every
former Club plugin. In Mode B, prefer:

| Want | Use the free plugin | Instead of |
|---|---|---|
| Per-word/per-char reveals | **SplitText** (`gsap/SplitText`) | Manual word `<span>` wrapping |
| Pinned chapters + scroll-scrub | **ScrollTrigger** (`gsap/ScrollTrigger`) | Custom IntersectionObserver pinning |
| Smooth scroll | **ScrollSmoother** (`gsap/ScrollSmoother`) | Lenis + RAF forwarding |
| Layout transitions | **Flip** (`gsap/Flip`) | Manual FLIP math |

Register once: `gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother)`.

## 6. Mobile-responsive — mandatory

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Typography in `clamp(min, fluid, max)` — never fixed `px` for `font-size`
- Disable pinning below 768px, but keep motion scroll-coupled and touch-safe:
  lerped image parallax (one transform-only mover per section) + scroll-linked
  entrance reveals (transform + opacity). JS-driven, NOT CSS `animation-timeline`
  (iOS Safari reports support but doesn't run it). See `references/mobile-motion.md`.
- `env(safe-area-inset-*)` padding on fixed nav / overlays
- Tap targets ≥ 44px square
- Mobile-first: design at 375px viewport FIRST, then scale up

## 7. Loading sequence

- Preload critical backgrounds with `<link rel="preload" as="image">`
- Show poster / blurred LQIP placeholder during decode
- First paint readable within ~1.5s on simulated 4G
- In Next.js, `<Image>` with `priority` on above-the-fold imagery

## 8. Performance — compositor-only paths, designed for 60fps (benchmark your targets)

- Only `transform` and `opacity` mutate per scroll frame
- `will-change: transform` on animated layers ONLY (never globally)
- `translate3d(0,0,0)` to force GPU compositing where needed
- Cache `getBoundingClientRect()` once on init + resize, never per frame
- No layout reads in scroll handlers
- Chrome DevTools Performance flame chart = all green (composite only)
- Lighthouse Performance ≥ 90

## 9. Component rules

- Every full-screen chapter: `id` + single `<section>` wrapper + `eyebrow`,
  `title`, `summary`, `features`, `asset`, `accent`
- All text overlays = **selectable HTML**, never baked into images
- `aria-label` on visual navigation controls
- Avoid scroll hijacking — pin per chapter, not the whole page
- On mobile: collapse pinned scenes into stacked vertical cards
- Prefer 16:9 backgrounds, 4:5 foreground figures

---

# Core Principles

1. **Reduced motion first.** Every effect degrades gracefully when
   `prefers-reduced-motion: reduce` is set. Pin hooks skip GSAP, layers snap
to stable mid-keyframe, tilt returns zeros.

2. **iOS WebKit video safety.** Safari freezes `<video>` frames inside a
   `transform-style: preserve-3d` ancestor that updates. Detect touch and
bypass the 3D wrapper for video.

3. **Animate transform + opacity only** in hot scroll paths.

4. **Pin chapters, not the page.** Each cinematic block opts into pinning.
   The rest of the document scrolls normally.

5. **Deterministic motion.** Any procedural value must be stable across
   re-renders so SSR and resize don't shift layout.

---

# Quality Bar

Output must compete with:

- **Shopify Editions** (Winter/Summer drops) — multi-chapter release worlds
- **Apple product launch pages** — pinned cinematic sequences
- **Linear release notes** — editorial typography + restraint
- **Stripe Sessions** — depth-of-field + atmospheric morphing
- **Awwwards SOTD nominees** in Editorial + Product Launch categories

"Looks like a Bootstrap landing page" or "looks like a Tailwind UI template"
= failure. Output should look studio-crafted. If constraints prevent this tier,
**say so explicitly** and deliver the highest-quality fallback the constraints
allow — never ship mid-tier silently.

---

# fal.ai Integration (Mode B)

This skill includes NO keys or credits. Every user creates their own fal.ai
account. The page works **without fal.ai** — `ChapterDemoVisual` renders
stunning CSS-only chapter visuals at $0.

## Setup

1. Walk new users through `examples/GETTING_STARTED.md`
2. Sign up at [fal.ai](https://fal.ai), create API key, add `FAL_KEY` to `.env.local`
3. Restart dev server after adding env vars
4. Never put `FAL_KEY` in client components or committed `.env` files
5. Mention they can skip fal.ai and use static images

## Technical rules

1. Never expose `FAL_KEY` in browser code
2. Use `@fal-ai/server-proxy/nextjs` — export `GET`, `POST`, **and `PUT`**
3. Always go through `lib/fal-models.ts` — never inline `image_size` or `negative_prompt`
4. Use server routes for production asset generation
5. Use `fal.subscribe` for ≤5 chapters; `fal.queue.submit` + webhook for >5
6. Set `allowedEndpoints` on the proxy + `allowUnauthorizedRequests: false`
7. Model IDs configurable via environment variables

See `MODELS.md` for the full model menu, cost table, and per-model parameter
differences. Default: `fal-ai/flux-2-pro` (~$0.06/img, ~4s).

---

# Quick-Start (For Expert Users)

Experienced users can skip the full pipeline by providing a complete brief
upfront. The agent runs all 5 phases internally and delivers the final output
in one shot. Use these prompts as templates.

## Quick-Start A: Single scroll section (Mode A)

> Build a cinematic-scroll pinned hero chapter for my [brand/product].
> Visual system: [Symmetric Monument / Clinical Noir / Storybook Geometry / Temporal Monument / Atmospheric Sublime / Warm Scrapbook / Naturalistic Drift].
> [N] chapters, [color palette], [typography feel].
> Pin duration [X]vh. Output: single self-contained HTML file.

The agent internally runs Phase 1-3 assumptions, builds (Phase 4), and
delivers a performance-annotated file with inline polish notes (Phase 5
lightweight).

## Quick-Start B: Full release site (Mode B)

> Scaffold a complete Shopify-Editions-tier cinematic release page for
> [product]. Visual system: [name]. [N] chapters. Demo mode first — no fal.ai
> key required. Copy templates verbatim from `templates/nextjs/`.

The agent runs the full pipeline internally: cinematic audit (assumed),
storyboard (assumed), technical spec (assumed), build (Mode B), and delivers
with a lightweight polish checklist.

## Quick-Start C: Existing project upgrade

> Add a cinematic-scroll pinned chapter to my existing [React/Next.js] project.
> Use choreo-3d primitives. Pattern: [Pinned Hero/Chaptered Release/etc from
> scroll-patterns.md]. Pin [X]vh, [N] layers. Match my existing [palette/typography].

The agent runs Phase 2-4 only, integrating with the existing codebase.

---

# Example Prompts — Full Pipeline (5-Phase)

These examples show how the complete gated pipeline works end-to-end.

## Example 1: Fintech Trust Page (Clinical Noir system)

> **Phase 1:** We're a fintech app that needs to communicate trust and
> precision. Our brand is clinical, data-driven, restrained. Audience:
> decision-makers on desktop. Build a cinematic-scroll experience using
> the Clinical Noir visual system from `references/film-archetypes.md`
> Section 2. Output: `cinematic-audit.md`.
>
> **Phase 2:** Based on the audit, design a 6-chapter motion storyboard.
> Chapters: Authority, Problem, Solution, Product, Proof, CTA. Use
> Chaptered Release pattern for chapters 1 and 5, Sticky Narrative for
> chapter 2, Data Story for chapter 4. Reference `references/scroll-patterns.md`
> Sections 5, 4, and 9. Output: `motion-storyboard.md`.
>
> **Phase 3:** Produce the technical spec. Use GSAP ScrollTrigger + Lenis +
> choreo-3d. Scrub 0.5, pin spacing true. Reference `performance-budget.md`
> Sections 1, 2, and 7 for all constraints. Output: `technical-spec.md`.
>
> **Phase 4:** Build Mode B — Next.js project from templates. 6 chapters,
> Clinical Noir palette (ash grey, steel blue, sickly yellow-green, black).
> CSS-only demo mode for first run. Output: project directory.
>
> **Phase 5:** Run the full polish checklist. Verify all 11 pre-launch
> checks from `performance-budget.md` Section 6. Confirm no banned patterns
> from `taste-guardrails.md` Section 1 survived. Output: `polish-report.md`.

## Example 2: Wellness Brand (Warm Scrapbook + Naturalistic Drift)

> **Phase 1:** We're a longevity science company. We want warmth,
> approachability, and land-connection. Primary system: Warm Scrapbook
> (`references/film-archetypes.md` Section 6). Accent system: Naturalistic Drift
> (Section 7) for the landscape chapters. Output: `cinematic-audit.md`.
>
> **Phase 2:** Design a 5-chapter storyboard. Chapters: Welcome, Science,
> Nature, Product, Community. Use Pinned Hero for ch1, Editorial Longread
> for ch2, Parallax Gallery for ch3, Chaptered Release for ch4, Landing
> Sequence for ch5. Reference `references/scroll-patterns.md` Sections 1,
> 8, 6, 5, and 10. Output: `motion-storyboard.md`.
>
> **Phase 3:** Technical spec with warm palette progression (rose → peach →
> amber → sage → cream). GSAP + Lenis. Mobile (≤768px): keep touch-safe
> scroll-coupled motion — lerped image parallax + scroll-linked entrance reveals
> (no pinning, no 3D tilt); see references/mobile-motion.md. Reference
> `performance-budget.md` Section 3 (Mobile Degradation Matrix). Output: `technical-spec.md`.
>
> **Phase 4:** Build Mode B. 5 chapters, organic editorial aesthetic.
> fal.ai for chapter images: `historicalLayer: 'atelier'`, painterly botanical
> subjects. Demo mode for first run. Output: project directory.
>
> **Phase 5:** Polish. Verify emotional arc matches Phase 1: welcome (warmth)
> → science (curiosity) → nature (awe) → product (trust) → community
> (belonging). Run 11-point checklist. Output: `polish-report.md`.

## Example 3: Sci-Fi Game Reveal (Temporal Monument, Mode A)

> **Phase 1:** We're launching a sci-fi game expansion. We want cosmic scale,
> event-level drama, layered realities. Visual system: Temporal Monument
> (`references/film-archetypes.md` Section 4). Audience: gamers, 70% desktop.
> Output: `cinematic-audit.md`.
>
> **Phase 2:** Design a 7-chapter storyboard. Chapters: Teaser, World, Lore,
> Characters, Gameplay, Release, CTA. Use Pinned Hero for ch1, Chaptered
> Release for ch2 and ch3, 3D Product Orbit for ch5, Landing Sequence for
> ch7. Reference `references/scroll-patterns.md` Sections 1, 5, 5, 7, and 10.
> Max 7 layers in ch2 (the deepest chapter). Output: `motion-storyboard.md`.
>
> **Phase 3:** Technical spec. Mode A output (single HTML). rAF-throttled
> scroll, no packages. 5-7 depth layers per chapter. 3D camera:
> `rotateX(±4deg)`, `translateZ(0 → -80px)`. Performance budget: all
> `transform` + `opacity` only, `will-change` on 3 elements max. Reference
> `performance-budget.md` Sections 1 and 2. Output: `technical-spec.md`.
>
> **Phase 4:** Build Mode A. Single self-contained HTML. Near-black backgrounds,
> deep teal and crimson accents, heavy grain overlay. 7 chapters, each pinned
> 200-300vh. Title reveals: mask wipe, word stagger, letter-spacing scrub,
> scale-down entrance — varied per chapter per `taste-guardrails.md` Section 4.5.
> Reduced-motion fallback: static compositions. Progress HUD included.
> Output: `index.html`.
>
> **Phase 5:** Polish the HTML. Verify: compositor-only scroll paths, < 5%
> dropped frames on 10s recording, reduced-motion shows all content, mobile
> <768px stacks with no pinning. No banned patterns from `taste-guardrails.md`
> Section 1. Output: `polish-report.md`.

---

# What's in the Box

```
cinematic-scroll-skill/
├── SKILL.md                      # Agent contract (5-phase pipeline) [this file]
├── taste-guardrails.md           # Quality enforcement system (11 banned patterns,
│                                 #   cinematic vocabulary, pacing rules,
│                                 #   anti-convergence principles)
├── design.md                     # Design contract (token roles, motion, banned patterns)
├── tokens/                        # DTCG design tokens (core / motion / semantic) + build/
├── themes/                        # 11 per-visual-system theme overlays
├── manifest.json                 # Skill manifest (v2.3.5)
├── MODELS.md                     # fal.ai model menu and cost table
├── README.md                     # Human-facing overview
├── LICENSE                       # MIT
├── references/
│   ├── scroll-patterns.md        # 12 proven scroll patterns (Sections 1-12),
│   │                             #   each with use case, depth config, transition,
│   │                             #   mobile strategy, performance budget
│   ├── film-archetypes.md        # 11 visual systems (Sections 1-11):
│   │                             #   Symmetric Monument, Clinical Noir,
│   │                             #   Storybook Geometry, Temporal Monument,
│   │                             #   Atmospheric Sublime, Warm Scrapbook,
│   │                             #   Naturalistic Drift, Brutalist Kinetic,
│   │                             #   Liquid Chrome, Botanical Editorial,
│   │                             #   Data Cinematic — each → a themes/*.theme.json
│   ├── performance-budget.md     # 60fps production contract:
│   │                             #   frame budget, permitted/forbidden properties,
│   │                             #   will-change strategy, mobile degradation matrix
│   │                             #   (4 tiers), benchmark targets, asset budgets,
│   │                             #   11-point pre-launch monitoring checklist,
│   │                             #   GSAP-specific rules, failure modes
│   └── mobile-motion.md          # Touch-safe mobile motion recipe:
│                                 #   scroll-coupled lerped parallax + entrance
│                                 #   reveals, the iOS Safari animation-timeline
│                                 #   gotcha, vanilla (Mode A) + framer (Mode B)
│                                 #   sketches, reduced-motion gating
├── examples/
│   ├── PROMPTS.md               # 20+ trigger prompts (Mode A and B)
│   ├── GETTING_STARTED.md       # fal.ai setup walkthrough
│   └── KNOWN_ISSUES.md          # QA log of known issues and fixes
├── templates/nextjs/            # Next.js App Router template:
│                                 #   package.json, ChapterScene.tsx (7-layer scene),
│                                 #   ChapterDemoVisual.tsx (CSS-only fallback),
│                                 #   EditionsPage.tsx (orchestrator),
│                                 #   fal proxy routes, fal client/lib/scripts,
│                                 #   SmoothScrollProvider, use-device hooks,
│                                 #   globals.css with fluid type scale,
│                                 #   tailwind.config.ts, tsconfig.json
└── assets/                      # Shared static assets
```

---

# Legal and Originality Rules

- Do not reproduce the Shopify logo, screenshots, copy, proprietary
  illustrations, exact section design, or exact visual scene.
- Do not generate images that imitate a living artist by name.
- Do not bake readable UI copy into generated images unless the user
  specifically asks and the target model supports reliable text.
- Build UI text, labels, nav, cards, numbers, and feature lists as HTML/CSS
  so they remain editable, accessible, and crisp.
- Use references only as art-direction benchmarks — chaptered release
  storytelling, not clone targets.
- If the user asks to clone a proprietary site exactly, respond by making
  an original system that uses the reference as inspiration.

---

# Anti-Patterns

Do NOT use this skill for:

- "Build a basic hero + features + pricing landing page."
- "Generate a WordPress theme."
- Ordinary SaaS landing pages, CRUD dashboards, or simple brochure sites
  — unless the user explicitly asks for a cinematic / editorial treatment.
- "Regenerate all templates from scratch without reading bundled files."
- "Give me motion ideas only, no code." (The skill must output runnable artifacts.)
