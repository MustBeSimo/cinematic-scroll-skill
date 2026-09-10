# Cinematic Scroll v3 implementation ledger

Release target: 3.0.0. All visual effects, rendering, templates and quality tools
are MIT; Studio retains its Motif Engine. Build both vanilla and React routes,
then create a local release commit/tag and sync Studio. No remote publication.

## Acceptance scope

- Shared runtime: lifecycle and browser tests; React provider and signal hooks.
- Six text treatments, proximity surfaces, four shader families and declarative mounting.
- Hardened WebGL2/R3F rendering and separate WebGPU/TSL preview.
- Adaptive quality, asset loading, GPU recovery, disposal and instrumentation.
- Additive compatibility for existing components and v2 choreography documents.
- Responsive flagship and isolated effects lab in both modes; public homepage integration.
- Skill references, component registry, installer/ClawHub packaging and version metadata.
- Runtime matrices, Next typecheck/build, existing test suite, visual review and TasteHQ >=0.75.
- Local release commit/tag followed by Studio base sync, rebuild and strict verification.

## Starting evidence

Canonical repository was clean except user-owned untracked assets/Homevideo/.
Baseline npm test passed before implementation. Studio has an uncommitted v2.6.9
sync; its content files were compared with canonical commit 089cd3a and matched.
Recheck both worktrees before release. The previous TasteHQ request failed with
resource-busy; no fidelity claim has been established.

## Implemented

- Pure frame-rate-independent damping, rectangle proximity, seeded randomness,
  and hysteretic quality governor with behavioral unit tests.
- Scoped browser runtime with one clock, external-clock mode, target measurement,
  motion/capability/visibility signals, cleanup and idle scheduling.
- Six semantic text treatments; stable-hit-area magnetic/depth surfaces; four
  original GLSL families. Real-pixel shader tests, offscreen idle and context recovery.
- React provider now reuses GSAP's ticker with demand attachment. SplitText handles
  autoSplit/onSplit and live static preference. R3F host, shader mesh and camera rig.
- Renderer-scoped GLTF Draco/Meshopt/KTX2 loading with bounded waits, late-result
  disposal, owned-resource cleanup and PMREM helper. Browser fixture tests pass
  loading, cancellation, timeout, late-result disposal and loader cleanup.
- Separate experimental WebGPU/TSL preview at template /webgpu-preview. WebGL2
  fallback exercised by browser test; actual hardware WebGPU not certified.
- Mode A effects lab with generated single-file index (npm run build:lab), editable
  page.template/CSS/JS and deterministic check:lab. Runtime included in installer
  and npm payload; detailed interaction-runtime reference routed from SKILL.md.
- Mode B effects lab and experimental preview. Small-screen text grid corrected.
- FIELD narrative flagship in vanilla and React, plus additive homepage links.
  Keyboard aperture input changes real scene pixels in both versions. React uses
  tiered particles, shadows and postprocessing, with a permanent SVG fallback.
- v3 signal-binding schema/compiler, scoped GSAP lifecycle and v2 compositor-safe
  substitutions, covered by compiler ownership and binding tests.
- Prop-compatible legacy kinetic headline, tilt card and magnetic cursor adapters;
  shared runtime copied deterministically into the Next template.
- Version metadata, component registry, references, ClawHub text-only guidance,
  installer and npm payload updated. Pack excludes dependencies, caches and env files.
- Template dependencies upgraded to Three/types 0.185.0, fiber9.7, drei10.7.8,
  postprocessing3.1.1/core6.39.4, xr6.6.30, Lenis1.3.26. Plan adjustment: core
  postprocessing excludes Three0.186, so 0.185 is the compatible release. Removed
  unused npm model-viewer3.4 (requires Three0.160); existing AR component retains
  its own CDN-pinned Model Viewer. Fresh resolved lock, npm ci succeeded.

## Verification so far (not release certification)

- npm test passes, including new pure runtime tests and packaging references.
- runtime/browser.test.mjs passes actual shader pixels for all four presets,
  live reduced motion, offscreen sleep, restoration and teardown.
- runtime/react.browser.test.mjs passes selector-driven scene change, stationary
  magnetic hit box, pause/revert, WebGL context recovery, forced WebGL2 TSL fallback,
  live reduced-motion poster and no-WebGL route.
- Template typecheck passes after dependency upgrades and new APIs.
- Generated vanilla lab and FIELD five-profile matrices PASS. React FIELD production
  matrix PASS: desktop, mobile, reduced motion, mobile reduced motion and no JS.
- React lab final production five-profile matrix PASS (.verify/v3-react-final).
- Final FIELD production five-profile matrix PASS after short-height adjustment
  (.verify/v3-field-final); mobile mid-page screenshots reviewed.
  Deliberate no-JS script CSP blocking is classified as advisory; other failures remain hard.
- Legacy React flagship, WebGPU preview and homepage browser proofs CLEAN.
- FIELD keyboard/aperture interaction browser test passes in both modes.
- Final template production build passes, including short-height CSS adjustment.
- Skill Creator quick validation passes via isolated uv/PyYAML environment.
- Final npm pack dry-run passes: 477 files, 9,324,572 compressed bytes; generated
  standalone exports and runtime copies pass deterministic prepack checks.
- Tarball-installed npm test passes. ClawHub static scan SAFE, risk 0; semantic scan
  was not run (no API key). This is not semantic safety certification.
- Generated vanilla lab Doctor93/100. Warnings include literal art colors and
  heuristic poster detection (real CSS poster exists); not a visual certification.
- On 2026-09-10 the user approved a temporary scoring preview. Only the two
  standalone HTML demos were staged and exposed; the repository and API routes
  were not exposed. The tunnel and staging server were stopped after scoring.
- Live-reference scoring returned HTTP 500 (Device or resource busy). Pinned
  grammar scoring completed for FIELD and the lab: both 70/100, below 75.
  Reports: .verify/v3-taste-field-pinned.json and .verify/v3-taste-lab-pinned.json.
  Both reports used 18 measured and 2 recovered axes, with no visual axes.
  Findings: heading weight, sentence length, type pairing, section/element gaps,
  whitespace density, accent frequency and dark mode. Source already specifies
  serif/sans pairing and system color preferences; inspect rendered evidence
  before treating those extraction findings as actual missing features.

## Still required before release

- Follow-up polish: compact section/card rhythm in both modes, more consistent
  accent labels, narrow-screen single-column vanilla lab, and FIELD intrinsic-grid
  overflow repair at 320px. Controls retain 44px targets. Added test:presentation
  for all four routes: distinct serif/sans computed families, live light/dark
  background changes, and no overflow at 320/390/768/1440px, without page JS.
  That test passes; the font-pairing and dark-mode extraction findings conflict
  with this rendered evidence. External 70/100 results are not overridden.
  Final Next production build, presentation test and FIELD interaction test pass.
  Root npm test and both standalone Doctor >=90 checks pass. Five-profile matrices
  for the compact React FIELD and vanilla lab passed; final 320px repairs were
  additionally checked by test:presentation. Screenshots reviewed.
  Re-score after polish remained 70/100 for both standalone pages with the same
  eight finding axes (.verify/v3-rhythm-taste-field.json / v3-rhythm-taste-lab.json).
  The temporary scoring tunnel and its staging server were closed afterward.

- Required external TasteHQ score >=0.75 is not met (0.70 for both standalone
  demos). Resolve genuine design mismatches and investigate extraction findings,
  then re-score affected artifacts. React pages have not been externally scored.
  Temporary scoring preview was authorized, not permanent publication or pushes.
- Real-device performance, Safari, hardware WebGPU and compressed Draco/KTX2 assets
  have not been certified; automated Chrome checks do not establish those claims.
- Studio dirty base was rechecked against its recorded canonical commit and matches.
  ONLY after verification create local v3.0.0 commit/tag, then sync/rebuild/strict-verify
  Studio. Neither release commit/tag nor Studio sync has happened.
- Preserve user assets/Homevideo/. No git push, deployment, npm or ClawHub publish.

## FIELD improvement pass — 2026-09-10

Standalone FIELD now uses an authored SVG iris and contour landscape in place of
its abstract portal shader. Compact opening, legible underline emphasis, explicit
aperture/reset behavior during pause and reduced motion, and hidden inert no-JS
controls. The React Three.js interpretation is unchanged. Updated example README
and interactive-study routing document the distinction. Added an independent
standalone interaction regression and included it in test:runtime:field.

Interaction/browser evidence is under .verify/field-improvement/. Required external
TasteHQ scoring for this redesign is pending authorization for a temporary public
preview; prior 0.70 scores are not a result for the redesigned page. No release,
Studio synchronization, or public deployment was performed in this pass.

### Authorized FIELD scoring result

On 2026-09-10, exposed only the generated standalone HTML via a temporary tunnel,
verified the public response matched the local file, and scored against the pinned
brand grammar. Saved artifact SHA-256 and report in
.verify/field-improvement/taste-score.json. Result: FAIL, fidelity 0.70 versus 0.75.
Findings: type.heading_weight, voice.sentence_length, whitespace.discipline,
surface.dark_mode. Coverage: 18 measured, two recovered, zero visual axes. The live
browser system-color check contradicts the dark-mode extraction finding; the
external failure remains authoritative for release status. Tunnel and isolated
staging server exited successfully immediately afterward. No release or Studio
sync occurred. Next polish remains heading weight, readable copy rhythm and density,
plus investigation of the dark-mode extraction disagreement.

## User correction — restore editorial direction

User explicitly preferred the earlier cleaner, elegant editorial identity and
rejected the purple treatment, especially on the main index. Restored the earlier
Cormorant/Space Grotesk font pairing, warm paper/charcoal and restrained brass/burgundy
tokens from canonical commit 089cd3a; removed colored background washes, glowing
shadows, tilted media framing and the large interaction promotion cards. Existing
example routes and working install/navigation remain. FIELD keeps its keyboard,
reset, reduced-motion and no-WebGL functionality with independent editorial styles.

User direction supersedes conflicting palette/surface suggestions in the supplied
Omnichannel target. Do not introduce purple/glow to improve that target score.
This is a visual restoration over current functionality, not a wholesale git revert.
Both five-profile browser matrices and FIELD interaction tests pass. Evidence in
.verify/editorial-restore/. External scoring has not been run for this revision;
previous scores refer to the rejected violet treatment. No public preview, release,
or Studio synchronization was created during this correction.

## Index refinement within the editorial direction

Replaced the cropped, autoplaying montage with the full Maison Solenne preview,
its own caption and live-example link. Playback is explicit, with pause, loading
cancellation, bounded failure handling and a poster fallback. Hidden/offscreen or
newly reduced-motion states pause it without resuming automatically. The homepage
continues to show all example routes, with the editorial collection before 3D.
Quieter captions, compact workflow rows, more readable small-screen gutters, and
mobile access to Examples improve browsing. KERN's caption now describes the actual
mechanism/video study. The repository AGENTS.md records the user's scoped editorial
preference so it is preserved without becoming the skill's universal aesthetic.

`npm run test:home` exercises actual playback, keyboard input, live reduced motion,
small-screen layout, retained example links, no-JS rendering and media failure.
Evidence for this pass: .verify/index-refinement/. No external scoring or public
preview was created for this iteration; the prior 0.70 score is historical evidence
for the rejected violet FIELD artifact, not certification of this index.


## Six 3D studies — 2026-09-10

Improved Aether, Nexus, Weather, Obsidian, Atelier Marne and Verdant. Aureus and
its existing shared dependencies were hash-checked and remain byte-identical.
The editorial homepage now features an opt-in Aureus recording and places the
3D collection first. The dedicated collection uses the same editorial direction
and order. Updated thumbnails are actual local browser captures.

Scene changes include camera framing and chapter dwell, mobile particle rendering,
wave displacement and signal control, drawing-buffer-correct raymarch resolution,
rounded cloud banks, glass composition, inward-facing gallery artwork, curved
instanced leaves, planted borders and lighting controls. Five studies share a
demand-aware frame owner; Aether retains its XR loop. Paused parameter changes,
live reduced motion, context recovery and no-JS content were exercised.

Validation: all six scene browser tests passed; the final Aether, Weather and
Obsidian changes passed their three targeted reruns. Homepage playback regression
and five-profile matrix passed. Final desktop scene captures report no runtime
errors. Evidence: `.verify/3d-refinement/`. These are local Chrome/SwiftShader
checks, not physical-device or XR certification. The skill reference now maps
the 3D studies to their transferable mechanisms.

Remote TasteHQ verification remains pending. The previous authorization covered
the standalone FIELD artifact only; no new public tunnel or deployment was opened.
The previous FIELD score does not certify these changes. No release, commit,
push or Studio synchronization was performed.


## Gallery motion — 2026-09-11

Per user request, Aureus's homepage preview autoplays muted on a loop. All 28
homepage example cards and seven dedicated 3D collection cards have whole-card
native links, proximity depth and lazy video previews. Coarse-pointer screens
preview the central visible card. Only one gallery card previews at once,
alongside the hero while visible. Posters persist on playback failure; reduced
motion and Pause previews stop playback and motion.

Added 21 short recordings of the actual local websites and reused seven existing
clips; assets/previews/manifest.json maps all 28. Shared motion reuses the cinematic
runtime for proximity, media parallax, heading entrances and hero drift. Regenerate
the browser bundle with npm run build:gallery. Browser regression covers autoplay,
proximity playback, scroll motion, whole-card navigation in both galleries,
narrow widths, reduced motion and no-JS links. Remote TasteHQ remains pending;
no public preview, deployment, push or merge was performed.

## Gallery catalog and 2.7.5 release preparation — 2026-09-11

- Preserved the approved opening. Placed all 28 existing project cards directly
  beneath it, in adjacent 7-project 3D and 21-project editorial collections.
- Adapted the Fable gallery reference into two desktop columns with numbered
  image-first cards, descriptions, native whole-card links, expandable build
  prompts, copy/source actions and progressive search. Mobile uses one column.
- Retained autoplay, proximity previews, scroll motion and accessible fallbacks.
- Synchronized package, lockfile, plugin, manifest and both skill editions to
  2.7.5; kept the independent choreography schema version unchanged.
- Passed npm test and gallery browser tests (layout, search, prompts, navigation,
  video, reduced motion, responsive overflow, no-JS). Inspected desktop/mobile.
- Release is prepared locally; no commit, push, tag or registry publication.
  External TasteHQ scoring of this revised index remains unverified; previous
  temporary-preview authorization was limited to standalone FIELD.

ClawHub public audit: latest 2.7.1; 1,330 downloads, 8 installs, 1 star;
no public moderation flag in the listing response. Public search returned this
skill first for “cinematic scroll”, absent from the returned “website design”
results, and no results for “3d website”. These are query observations, not an
overall quality rank. Official HTTP API docs describe relevance/name-token
boosts, a capped popularity contribution, and seven-day installs for trending.
No ClawHub metadata was changed by this audit.

## Skill and catalog refinement — 2026-09-10

- Updated both skill discovery descriptions and synchronized Codex/Cursor pointers.
  Added a live showcase link to the self-contained ClawHub edition and updated the
  documented publish display name; no registry metadata has been published.
- Added subject-based 3D selection guidance and removed a showcase-specific Aureus
  preference from reusable skill instructions. Aureus website files remain untouched.
- Authored 28 distinct gallery descriptions/prompts from inspected example content;
  corrected Naturally Rooted and Novadeck titles, retained search aliases, and fixed
  copy-button label restoration.
- Passed bundle, consistency, pointer, link and gallery browser checks. Additional
  browser checks verified clipboard content, label restoration, search aliases and
  narrow layout; screenshots inspected in .verify/refinement-2.7.5/.
- Skill-creator validator passed via uv with PyYAML. Unsuppressed SkillSpector
  --no-llm returned zero issues; semantic analysis was skipped, so its overall
  analysis is partial. No claim of full security or external taste certification.
- Version remains 2.7.5. No commit, push, deployment or registry publication.

## Reach and installation improvements — 2026-09-10

- Updated public GitHub About description and added threejs, webgl and web-design
  topics; preserved existing topics. Baseline: 34 GitHub stars.
- Submitted validated ClawHub 2.7.5 (seven uploaded text files, ignore file excluded)
  as “Cinematic Scroll — 3D Website Design”, with topics web-design, threejs and
  scroll-animation. CLI returned pending-publication; public latest remained 2.7.1.
  Version ID: k9781mp7246wz5nwwcca3agpx98e5e3r.
  Attempt ID: zx70vhz664zw7e6vrjrh1xf5mx8e4189.
  Fingerprint: 9d94588d95a8828bbd0ac6d90567f000b90ce0172bcdab9038378a65383f56ad.
- Local README now shows both ClawHub and coding-agent install routes near the top,
  prioritizes Aureus in the 3D table, and includes a voluntary GitHub star link.
- Local showcase has a dedicated ClawHub install command/package link and star CTA;
  title, social metadata and a 32-route sitemap improve discoverability.
- Gallery browser regressions passed; mobile installation panel visually inspected,
  no overflow; all sitemap destinations exist. No additional runtime changes.
- Launch copy saved under .verify/reach-2.7.5/launch-copy.md; no outreach sent.
  README/showcase/sitemap remain local; no GitHub source push or Pages deployment.
  Required external taste verification remains outstanding for the revised showcase.
