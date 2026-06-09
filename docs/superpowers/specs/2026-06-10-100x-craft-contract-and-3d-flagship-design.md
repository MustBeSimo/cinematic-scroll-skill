# 100x: The Craft Contract + the 3D/WebXR Flagship — Design

**Date:** 2026-06-10
**Branch:** `feat/100x-craft-contract`
**Status:** Approved for execution (user directive: "execute them all in sequence", "build all", "make no mistake")

## Problem

The `cinematic-scroll` skill is the stronger *system* among cinematic-web agent skills
(taste enforcement, gated pipeline, performance budgets, mobile degradation, web→video
bridge), but a competitor (`amrrs/cinematic-webscroll-frontend-skill`) is a cleaner public
*package* and exposed two real gaps:

1. **No explicit 3D / shader stack selection** (GSAP-only vs +Three+GLB vs +Three+shaders),
   no WebXR path, no codified 3D asset spec.
2. **No undeniable flagship proof** that the craft system produces best-in-class output.

The deeper opportunity: every cinematic-web skill stops at *prompting*. None make "cinematic
taste" **machine-enforceable**. That is the wedge.

## Goal (the 100x)

Make `cinematic-scroll` the category standard by:

1. **Turning the craft contract into an executable quality gate** (`cinematic-doctor`) that
   scores any build 0–100 and fails CI below threshold. "Cinematic" becomes a *number*.
2. **Shipping a flagship 3D/WebXR cinematic site** — one site, four chapters, four 3D
   modalities — in two builds (vanilla Three.js + R3F/WebXR), responsive, mobile-degrading,
   and compilable to video.
3. **Codifying 3D/shader stack selection + WebXR into the skill** (the exposed gap, done deeper).
4. **Cross-agent packaging** (Cursor / Codex / Claude) on top of existing npm + plugin channels.
5. **Repositioning** the public narrative around measurable craft + the flagship + web→video.

## Key structural decision

Four requested 3D worlds become **one flagship with four chapters**, not four sites. Shared
rendering infra, one scroll choreography, one narrative, one `compile-choreography.json` →
also compiles to video. Everything runs **today** with procedural placeholder geometry; real
GLBs drop into an asset manifest later with zero code changes.

| Chapter | Modality | 3D asset | XR mode |
|---|---|---|---|
| 1 — Object | Premium product showcase | 1 hero GLB | AR quick-look (model-viewer) |
| 2 — World | Cinematic environment fly-through | 1 scene GLB + props | WebXR immersive |
| 3 — Field | Abstract procedural shader | none (zero-dep) | — |
| 4 — Figure | Avatar (HyperFrames tie-in) | 1 rigged GLB | WebXR + quick-look |

## Architecture

### Pillar 1 — `cinematic-doctor` (executable craft contract) — THE MOAT
- **Location:** `tools/cinematic-doctor/` + `bin` entry.
- **Form:** Node CLI, zero/minimal deps (Node stdlib + a tiny HTML/CSS tokenizer; no heavy parser).
- **Input:** an HTML file, a directory of examples, or a built Next.js route export.
- **Checks (weighted):**
  - *Taste lint:* banned patterns from `taste-guardrails.md` (default easings, `transition: all`,
    uniform fade-ins, aesthetic convergence heuristics).
  - *Performance budget:* layer count/chapter, transform/opacity-only hot paths, image weight,
    blocking scripts, `devicePixelRatio` cap presence, 3D draw-call/poly hints.
  - *A11y:* `prefers-reduced-motion` branch present, alt text, focus-visible styles, landmarks.
  - *Mobile degradation:* viewport meta, no hover-only interaction, reduced-layer path, touch events.
  - *3D/XR:* WebGL context-loss handler, fallback element present, Draco/compression hint,
    XR feature-detection before session request.
- **Output:** `cinematic-report.json` + printed scorecard; exit code non-zero below threshold (default 80).
- **Self-test:** ships fixtures (a "good" and a "bad" page) so `--selftest` proves the gate works.

### Pillar 2 — 3D stack codified in the skill
- `references/3d-stack.md` — decision tree (GSAP-only / +Three+GLB / +Three+shaders / +WebXR),
  **pinned versions**, perf caps (pixelRatio ≤ 2, draw-call & poly budgets), fallback rules,
  model-viewer quick-look pattern, WebXR session setup, Draco/USDZ conversion path.
- `ASSETS-3D.md` — exact GLB/FBX spec per chapter (format, tri budget, units/scale, pivot,
  PBR materials, rig for avatar, Draco, USDZ for iOS AR). The hand-off doc for the user.
- `SKILL.md` patches: Phase 3 stack-choice block, Phase 4 3D build rules, Phase 5 3D/XR polish.
- `taste-guardrails.md`: 3D-specific banned patterns (uncapped pixelRatio, no fallback,
  no reduced-motion path for 3D, jank-on-scroll from raycasts, etc.).

### Pillar 3 — Flagship demo (two builds)
- `examples/flagship/` — **Mode A**, vanilla Three.js, single folder, `file://`-runnable.
  4 chapters, procedural placeholders, scroll-driven camera, model-viewer AR quick-look,
  WebXR-capable, responsive, reduced-motion + mobile-degraded paths, asset manifest stub.
- `templates/nextjs/app/flagship/` — **Mode B**, R3F + drei + `@react-three/xr`, WebXR
  immersive, same choreography, typechecked.
- `scroll-choreography` entry for the flagship so it compiles to video (web→video proof).

### Pillar 4 — Cross-agent packaging
- `AGENTS.md` (root), `.cursor/skills/cinematic-scroll/`, `.codex/skills/cinematic-scroll/`,
  `.claude/commands/cinematic-scroll.md` — **thin pointers** to canonical `SKILL.md` (DRY).
- Keep npm installer + plugin marketplace intact.

### Pillar 5 — Positioning
- README rewrite: lead with measurable-craft moat → flagship → web→video bridge.
- `launch/` positioning + narrative updated.

## Orchestration (parallel agents + hard gates)

Runs on `feat/100x-craft-contract`. Parallel agents partitioned to **disjoint paths** to
avoid write conflicts; shared-file edits (SKILL.md, README, package.json) are sequential.

- **Phase 1 (parallel):** doctor CLI (`tools/`) · 3D refs + `ASSETS-3D.md` (`references/`, root) ·
  packaging (`AGENTS.md`, `.cursor/`, `.codex/`, `.claude/`). → **GATE 1:** `cinematic-doctor --selftest` passes.
- **Phase 2 (sequential):** Mode A flagship (`examples/flagship/`) → doctor scan → auto-fix loop → **GATE 2A** (score ≥ 80).
- **Phase 3 (sequential):** Mode B flagship (`templates/nextjs/`) → `tsc` typecheck + doctor → **GATE 2B**.
- **Phase 4 (sequential):** SKILL.md / guardrails patches · README / positioning · package.json bin →
  **GATE 3:** full-repo doctor sweep + template typecheck.

Every gate is hard: a fail blocks advance and triggers a fix agent.

## 3D asset hand-off spec (summary; full in ASSETS-3D.md)

| Chapter | File | Tris | Notes |
|---|---|---|---|
| Object | `.glb` (Draco) + `.usdz` | ≤150k | real-world meters, pivot base-center, PBR metal/rough |
| World | `.glb` (Draco) | ≤500k total | baked lighting preferred, named camera-path nodes |
| Field | — | — | procedural, no asset |
| Figure | `.glb` rigged + `.usdz` | ≤80k | humanoid (Mixamo bones ideal), 1–2 idle/gesture clips |

`.fbx` accepted as source; conversion to `.glb`/Draco/`.usdz` documented. Procedural stand-ins
keep all chapters alive until real assets arrive.

## Out of scope (YAGNI)
- No multiplayer / networked XR.
- No new image-generation models beyond existing fal.ai pipeline.
- No backend; flagship is static (Mode A) + static-export-friendly (Mode B).

## Success criteria
- `cinematic-doctor --selftest` passes; scores the 5 existing examples and the flagship.
- Flagship Mode A runs from `file://` with zero assets (procedural), passes doctor ≥ 80.
- Flagship Mode B typechecks and exposes Enter-VR/AR.
- SKILL.md documents the 3D stack decision + WebXR; `ASSETS-3D.md` lets the user deliver real models.
- Cross-agent packaging present; README repositioned.
