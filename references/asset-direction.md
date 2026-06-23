# Asset Direction — design the world before the layout

> **Phase 1.5 of the pipeline.** Runs *after* the Cinematic Audit (Phase 1) and *before*
> the Motion Storyboard (Phase 2). This is the module that turns "a nice scroll page" into
> "an immersive brand world." It is **required** for any brief that says *release · launch ·
> immersive · premium · flagship · "wow"*, and skippable only for a single utilitarian
> section. Output artifact: **`art-direction.md`**.

## Why this exists

A great motion grammar applied to a layout produces a competent page. What separates the
top tier is that **the layout serves a world, not the other way around.** The reference
builds people screenshot have three things most agent output misses:

1. **A visual world before a layout** — a surreal/specific asset language (glowing mesh
   ribbons, molten chrome, spotlit sculpture, overgrown concrete) that the sections are
   *placed inside*, not decorated with.
2. **Motion as narrative** — the scroll reveals scale, changes focus, reframes the hero,
   then lands into product. The camera *tells* something.
3. **Asset orchestration** — a small set of recurring motifs reused across sections so the
   whole thing reads as one place. Not random image drops.

The Cinematic Audit decides *mood and arc*. This phase decides *the physical world that mood
lives in, and where every pixel of it comes from* — so the build can't drift into generic.

## The five decisions (this IS the artifact)

Fill every one. Vagueness here is the #1 cause of a 7/10 result.

### 1. World premise — one sentence
The place, material, and physics the brand lives in. Concrete nouns, not adjectives.
- ✅ "A dark studio where wealth is molten chrome you fly down through."
- ✅ "A museum at night; each idea is a gold sculpture under its own spotlight."
- ❌ "A modern, premium, clean fintech vibe." (adjectives → generic)

### 2. Hero concept — the gate
A single **subject** + a single **verb the visitor does to it**, delivered in real motion.
This is blocking: it must pass the **[Hero Concept Gate](wow-gate.md)** before you proceed.
- ✅ "You *fly down through* a liquid-chrome corridor." (verb: fly-through)
- ✅ "You *walk past* turning sculptures as the camera tracks the hall." (verb: walk)
- ❌ "A dark hero with a big headline and a 3D image." (no verb, no subject — REJECT)

### 3. Motif system — 3–5 recurring elements
The handful of visual elements reused across sections so it reads as one world. Each section
must carry **at least one** motif. Name them and where they recur.
- e.g. `{ ribbon, plinth-spotlight, floating-shard, grain, signal-line }`
- The motif is the through-line. Random per-section imagery is the tell of AI slop.

### 4. Material & light language
The texture / material / lighting vocabulary, plus the palette **roles** (not just hexes).
- Material: chrome · glass · fog · paper · concrete · velvet · neon · plasma…
- Light: single hard spotlight · overcast soft · dawn rim · studio 3-point · volumetric god-rays
- Palette by role: `--bg`, `--accent`, `--accent-2` (resolve through tokens — see `design.md`).

### 5. Asset sourcing plan — per asset, named
For **every** visual the world needs, decide where it comes from. This is what closes the
"generative visuals" gap honestly: the skill renders motion + procedural 3D; generated art
comes from fal.ai or is faked procedurally.

| Asset | Source | Notes |
|---|---|---|
| Hero | **Procedural (shader/3D)** \| **fal.ai image** \| **fal.ai → GLB** \| **CSS** | If 3D, name the Tier ([3d-stack.md](3d-stack.md)) and the camera move |
| Section motifs | Procedural / SVG / CSS | Prefer procedural so they animate + theme |
| Textures / grain | CSS / SVG `feTurbulence` | Zero-asset |
| Characters / illustration | **fal.ai** (Mode B) | The skill does NOT generate these — pair an image model |
| Photography | User-supplied / fal.ai | Optimize + LQIP (perf budget §5) |

**Rule of sourcing:** prefer **procedural** (shader/CSS/SVG) for anything that should move,
react, or re-theme; use **fal.ai** only for art the GPU can't compute (characters,
painterly scenes, photographic texture). Never ship a hero that's a stock gradient + icon.

## The coherence rule (enforced)

> Every section must reuse **≥1 motif** *and* the material/light language from the artifact.

If a section can't, it doesn't belong in this world — change the section or change the world.
This single rule is what produces "asset coherence" instead of a deck of unrelated slides.

## The signature moment

Name the **one** designed peak the build is engineered around — the shot people screenshot:
the dolly-through, the refraction, the count-up reveal, the curtain-parting reframe. One per
build, minimum. Record it in `art-direction.md`; the polish phase verifies it survived in the
page-proof frames. A build with no signature moment is, at best, tasteful — never *wow*.

## Anti-patterns (reject on sight)

- **Stock hero** — gradient + product screenshot + icon. No world.
- **Motif drift** — a different unrelated image/treatment per section.
- **Decorative 3D** — a mesh that spins because 3D is cool, doing nothing the story needs.
- **Adjective world** — "premium, clean, modern" with no concrete place/material.
- **Asset hand-waving** — "AI will make some visuals" with no per-asset source decision.

## Output: `art-direction.md`

→ Template in [`artifact-templates.md`](artifact-templates.md) (the **art-direction.md**
section). Fill all five decisions + the signature moment, run the
[Hero Concept Gate](wow-gate.md), then hand to Phase 2 (Motion Storyboard). The storyboard's
chapters must each name which motif(s) they carry.
