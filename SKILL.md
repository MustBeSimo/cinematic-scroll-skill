---
name: cinematic-scroll
description: Build or improve cinematic websites with scroll-driven storytelling, pinned reveals, parallax, kinetic type, and optional 3D. Deliver standalone HTML or integrate into an existing app, with mobile and reduced-motion fallbacks and browser evidence. Also supports scroll audits and motion storyboards. Use for cinematic web work, not ordinary forms, dashboards, or unrelated animation.
license: MIT
metadata:
  version: 2.7.0
  author: Simone Leonelli
  permissions: filesystem:read, filesystem:write, network:fetch, shell:execute, env
  hermes:
    tags: [Animation, Frontend, Design, 3D, Motion, GSAP, Parallax, WebGL]
    related_skills: []
---

# Cinematic Scroll

Make the first build worth keeping. Deliver a distinctive scroll experience with
a clear story, a memorable moment, and complete mobile and static compositions.
The motion craft comes from this skill; the aesthetic belongs to the user.

This is the **normal, free MIT edition**. It builds complete sites without a Studio
license, account, generated assets, or TasteHQ connection. Existing 3D examples,
Next.js templates, audit tools, and the basic choreography compiler remain included.
Studio adds the proprietary Motif Engine: accumulated knowledge, reuse tracking,
retrieval, and variants. Read [edition boundaries](references/editions.md) when
upgrades are relevant. Never add sales messages to a generated website.

## Route to the smallest complete deliverable

| Request | Route | Read when needed |
|---|---|---|
| Hero, section, one-page story, first experiment | **Mode A:** standalone HTML; no build step or key | [Build recipes](references/build-recipes.md), [components](references/component-grammar.md) |
| Add or fix motion in an existing app | **Integrate:** preserve framework, routes, styling, dependencies | [Build recipes](references/build-recipes.md) |
| New Next.js release site or multi-route app | **Mode B:** start from the bundled template | [Template](templates/nextjs/FLAGSHIP.md) |
| Storyboard, direction, or motion ideas only | Deliver the requested plan; no unsolicited app | [Story design](references/story-design.md) |
| Audit a URL / improve an existing build | Inspect first; recommend for an audit, implement for an improvement request | [Audit mode](audit-mode.md), [doctor](tools/cinematic-doctor/README.md) |
| Study a reference and distill a recipe | Learn preview; no automatic cross-project memory | [Learn mode](learn-mode.md) |
| Benchmark a public URL | Passive benchmark with measurement conditions | [Bench mode](bench-mode.md) |
| Real 3D object or camera flight | Earn the renderer tier; preserve a non-WebGL fallback | [3D stack](references/3d-stack.md), [assets](ASSETS-3D.md); [XR](references/webxr.md) only for XR |
| Video timeline from a scene | Basic compiler, not an MP4 renderer | [Compilation](scroll-choreography-compilation.md), [edition boundaries](references/editions.md) |

Use absolute paths to installed skill tools from another project. Examples are
references, not mandatory layouts. Do not infer Next.js merely from “page.”

## Phase 0 — Establish the brief and brand

Inspect applicable `AGENTS.md`, project files, supplied copy/assets, and the current
page. Resolve audience and desired action; palette/type/density/emphasis; delivery
format and target browsers; and requested motion intensity.

For a result request, state a reasonable art-direction assumption and proceed.
Ask only about missing information that materially changes the result. Do not
require the user to choose film terminology, packages, chapter counts, or providers.
Honor requested review checkpoints; otherwise finish the work without phase approvals.

**Brand precedence:** explicit user direction → applicable project contract →
existing brand assets → reference analysis → suggested visual system. Themes are
starting points. Preserve required axes when adapting an example with a different look.

**Optional TasteHQ:** for an in-scope external brand analysis, read
[the TasteHQ contract](references/tastehq.md). Query `/api/query`, preserve the
response, and map relevant axes to project tokens. A suggested catalog match does
not override the user's brand or authorize overwriting `AGENTS.md`. Offline,
build from the local brief/contract. A required external judge stays unverified
until it actually runs; an outage is never a passing score.

## Phases 1–3 — Direct the story before adding effects

Read [story design](references/story-design.md) for new pages and major redesigns.
Read [taste guardrails](taste-guardrails.md) for craft guidance. The scope, user
preferences, and accessibility rules here take precedence over legacy blanket
minima for layers, pins, smooth scrolling, and variation.

Choose a concrete signature moment that explains this subject: expose a product's
mechanism, reframe an image to reveal scale, or follow a real journey on a map.
Build an arc from orientation through discovery and evidence to action. Use only
the chapters the content needs. Not every section needs a pin, a different
transition, five layers, a temperature change, or 3D.

For each beat specify **start → transformation → readable hold → exit**, its focal
point, and its mobile/static versions. Compose midpoints as carefully as opening
frames. Keep copy and the primary action accessible without waiting for spectacle.

For an immersive/world-building brief, also read
[asset direction](references/asset-direction.md) and the [Wow Gate](references/wow-gate.md).
Use its rubric as a concept critique, not proof of audience preference or a reason
to override a restrained brief. Prefer supplied assets; CSS/SVG for graphical
subjects; available image tools for authored imagery when appropriate. Paid
generation is optional and uses an authorized provider/budget.

**Process should fit the ask.** A section needs brief decisions and polish notes.
A full story benefits from one project note containing the arc, beat table, asset
sources, implementation choices, and evidence. Use separate `cinematic-audit.md`,
`motion-storyboard.md`, `technical-spec.md`, and `polish-report.md` for a requested
staged process or a complex project; [artifact templates](references/artifact-templates.md)
are available. Do not impose four documents on a small hero request.

## Phase 4 — Build the readable page, then enhance it

Read [build recipes](references/build-recipes.md). Use existing project tokens or
adapt [design.md](design.md) and [design tokens](references/design-tokens.md).
Keep palette, typography, spacing, and motion roles consistent without tokenizing
every incidental geometric constant or replacing an established design system.

1. **Static composition first.** Semantic headings, selectable text, useful links,
   meaningful alt text, visible focus, and a working primary action. Essential
   content renders before enhancement. JS/CDN/video/WebGL failure must not erase it.
2. **One owner per animated property.** Nest wrappers for parallax, pointer tilt,
   and entrance transforms. Use one scroll clock and scoped cleanup.
3. **Direct scrubbing stays direct.** Linear progress suits position-linked motion;
   chosen easing suits time-based entrances. Avoid stacking smoothing and springs
   until motion trails the visitor.
4. **Selective pinning.** Separate the pin shell from moving children. Derive
   distance from the content and beat budget, not a total-page vh quota. Test
   anchors, reverse scroll, resize, and restored scroll positions.
5. **Responsive composition.** Default to free flow on narrow/coarse-pointer
   devices, modest parallax, and readable reveals. Tilt requires hover and a fine
   pointer. [Mobile motion](references/mobile-motion.md) provides fallback recipes;
   test the project's browser targets instead of assuming version support.
6. **Complete reduced motion.** Skip pinning, parallax, smoothing, autoplay, and
   continuous loops. Show readable content in flow. Respond to preference changes.
   A user request for static or minimal motion takes precedence.
7. **Cheap hot paths.** Prefer transform/opacity; batch geometry reads outside
   scroll writes; refresh after fonts/assets alter layout; avoid permanent layer
   promotion. Read [performance budgets](references/performance-budget.md) for
   substantial scenes. Treat device numbers as targets to measure, not claims.
8. **Owned lifecycle.** Remove listeners, observers, tickers, split text, and owned
   triggers on teardown. Never kill all ScrollTriggers in a shared app. Bound
   loaders; do not cover a usable page indefinitely.

Tier B/C/D additionally requires one renderer, capped pixel ratio, manifest asset
paths, context-loss recovery, disposed GPU resources, visibility gating, and a
permanent poster. XR starts only on an explicit user action. For fal.ai, read
[MODELS.md](MODELS.md) and use the bundled server adapters; keep credentials
server-side. No provider key is required for the first build.

The [choreography compiler](scroll-choreography-compilation.md) is optional.
Inspect and test generated code against lifecycle/fallback requirements;
compilation alone does not certify production readiness.

## Phase 5 — Prove the actual output

Run commands from the user's project, substituting the installed skill path:

```bash
# Static HTML: contract checks and doctor.
node /path/to/cinematic-scroll/tools/verify/verify-build.mjs ./index.html

# Final HTML: desktop, mobile, reduced motion, and no-JS evidence.
node /path/to/cinematic-scroll/tools/verify/verify-build.mjs ./index.html --phase polish

# App: running URL plus the project's own typecheck/build scripts.
node /path/to/cinematic-scroll/tools/verify/verify-build.mjs http://localhost:3000 --mode-b . --phase polish
```

The [verifier](tools/verify/README.md) distinguishes PASS, FAIL, and SKIP.
Requested runtime/build failures fail the command. Missing requested evidence is
incomplete; `--fast` is diagnostic, not final proof. Doctor is a static heuristic,
not a visual judge or React runtime test. Fix actual problems, not regex scores.

**Look at screenshots.** Check opening, signature moment, pin boundaries,
midpoints, and closing on desktop/mobile. Inspect reading order, collisions,
cropping, blank canvas, readable hold, and reachable CTA. Use
[page-proof](tools/page-proof/README.md) for extra depths when defaults miss a beat.
A clean console does not establish visual quality.

Test reduced motion, keyboard navigation, asset failures, and viewport changes.
Browser emulation is not physical iPhone Safari or a battery test. Report only
measurements actually made; mark other checks as not run.

If the project requires TasteHQ, score a reachable build against its declared
target using [the adapter](references/tastehq.md). Preserve fixes, coverage, and
the project's threshold. Do not publish solely to satisfy a judge without
deployment authorization.

Fix observed issues and re-run affected checks. If a required check is blocked,
deliver the working artifact with the missing verification clearly identified.
Do not label it fully verified.

## Handoff

Lead with the preview/file and exact opening command. State the signature moment,
what can be customized, checks passed, and material limitations. No unsupported
“60fps” or “production-ready” claims. No unsolicited branding, tracking, attribution
footer, or upgrade banner in the output. Mention Studio only when its workflow
answers an expressed need; normal completes ordinary cinematic sites on its own.
