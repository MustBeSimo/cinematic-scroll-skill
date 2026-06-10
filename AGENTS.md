# AGENTS.md

This repo ships one agent skill: **`cinematic-scroll`**.

## What it is

A *craft skill* that gives any coding agent the taste to build cinematic,
scroll-driven websites — pinned chapter reveals, hero parallax, multi-depth
figures, hover-tilt cards, environment-morphing backgrounds, and full
release/launch pages. The motion grammar is the constant; the aesthetic is
always the user's (brutalist, quiet-luxury, neon pop, sci-fi noir, Renaissance
editorial, or your brand). It scales from a single self-contained `.html` scroll
section (Mode A) to a full Next.js release site with optional AI-generated
visuals (Mode B), and runs through an optional 5-phase pipeline (cinematic audit
→ motion storyboard → technical spec → build → polish).

## When to use it

Reach for `cinematic-scroll` when the user asks for any of: a scroll-driven or
"cinematic" website, pinned/sticky chapter sections, hero or multi-depth
parallax, scroll-linked 3D tilt or camera moves, environment/background-morphing
layouts, a product story page, an editorial commerce microsite, or a
release/launch/drop page.

## Canonical contract

**`SKILL.md` (repo root) is the single source of truth.** Read it in full before
building — it is the machine-readable agent contract for both Mode A and Mode B.
Do not duplicate or paraphrase it; point to it.

Deep references live in [`references/`](./references/):

- [`references/scroll-patterns.md`](./references/scroll-patterns.md) — 12 proven scroll patterns
- [`references/film-archetypes.md`](./references/film-archetypes.md) — 7 visual systems / film archetypes
- [`references/performance-budget.md`](./references/performance-budget.md) — transform/opacity budget + 11-point pre-launch checklist
- [`references/mobile-motion.md`](./references/mobile-motion.md) — mobile motion + reduced-motion degradation

Taste rules: [`taste-guardrails.md`](./taste-guardrails.md). Human quickstart:
[`README.md`](./README.md).

## Trigger usage

> Use **cinematic-scroll** to build a self-contained HTML pinned hero chapter for [YOUR BRAND].

More copy-paste triggers across aesthetic worlds: [`examples/PROMPTS.md`](./examples/PROMPTS.md).
