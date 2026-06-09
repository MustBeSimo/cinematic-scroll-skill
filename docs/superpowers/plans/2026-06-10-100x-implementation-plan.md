# 100x Implementation Plan

Spec: `docs/superpowers/specs/2026-06-10-100x-craft-contract-and-3d-flagship-design.md`
Branch: `feat/100x-craft-contract`

## Execution model
Orchestrated via the Workflow tool. Parallel agents write to **disjoint paths**; shared-file
edits are sequential. Hard gates between phases via `cinematic-doctor`. After the workflow
completes, the orchestrator (me) runs the doctor + typecheck locally, fixes residuals, commits.

## Phase 1 — Foundation (parallel, disjoint paths)
1a. **`tools/cinematic-doctor/`** — `index.mjs` (CLI), `checks/*.mjs` (taste, perf, a11y, mobile, 3d),
    `fixtures/good.html`, `fixtures/bad.html`, `--selftest`. Zero heavy deps.
1b. **`references/3d-stack.md`**, **`references/webxr.md`**, **`ASSETS-3D.md`** — stack decision tree,
    pinned versions, perf caps, WebXR + model-viewer patterns, Draco/USDZ path, asset hand-off spec.
1c. **Packaging** — `AGENTS.md`, `.cursor/skills/cinematic-scroll/SKILL.md` (pointer),
    `.codex/skills/cinematic-scroll/SKILL.md` (pointer), `.claude/commands/cinematic-scroll.md` (pointer).

**GATE 1:** `node tools/cinematic-doctor/index.mjs --selftest` → good fixture passes, bad fails.

## Phase 2 — Flagship Mode A (sequential)
2. **`examples/flagship/`** — `index.html`, `main.js`, `styles.css`, `assets-3d/manifest.json`.
   Vanilla Three.js (pinned), 4 chapters (Object/World/Field/Figure), procedural placeholder geometry,
   scroll-driven camera, model-viewer AR quick-look, WebXR feature-detect + Enter-XR, responsive,
   `prefers-reduced-motion` + mobile-degraded paths, WebGL context-loss handler, CSS fallback.
2-gate. Run doctor on `examples/flagship/`; **GATE 2A** requires score ≥ 80. Fix loop (≤2) on fail.

## Phase 3 — Flagship Mode B (sequential)
3. **`templates/nextjs/app/flagship/`** — R3F + `@react-three/drei` + `@react-three/xr` route,
   same 4-chapter choreography, Enter-VR/AR, suspense/fallback, typed. Add deps to template `package.json`.
3-gate. `tsc --noEmit` on the route (best-effort) + doctor on exported markup; **GATE 2B**.

## Phase 4 — Integration + positioning (sequential, shared files)
4a. Patch **`SKILL.md`** — Phase 3 stack-choice block, Phase 4 3D build rules, Phase 5 3D/XR polish.
    Patch **`taste-guardrails.md`** — 3D-specific banned patterns.
4b. Add **`bin`/script** for `cinematic-doctor` in root `package.json`; add `npm run doctor`.
4c. Rewrite **`README.md`** lead + update **`launch/positioning.md`**, **`launch/NARRATIVE.md`**.
4d. Add a **flagship choreography** entry so it compiles to video.

**GATE 3:** full-repo `cinematic-doctor` sweep over `examples/*` + `examples/flagship/`;
template typecheck; report scorecard.

## Post-workflow (orchestrator)
- Run doctor + typecheck locally, fix residuals.
- Commit in logical chunks; do NOT push (user pushes when ready).
- Summarize: what shipped, the 3D asset hand-off, how to run each build, residual TODOs.
