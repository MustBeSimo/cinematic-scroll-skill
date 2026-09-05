# Workflow evaluations for the normal edition

These are behavioral acceptance scenarios, not claims of measured model accuracy.
Run them with a fresh agent in an isolated project when evaluating skill behavior.
Inspect the result and browser evidence; a document containing the expected words
is not a pass. Do not copy Studio's overlay into the evaluation workspace.

| Request / supplied context | Passing behavior | Failure to watch for |
|---|---|---|
| “Make a cinematic one-pager for this product. No keys.” Supply product copy and a still. | Complete standalone page, working action, supplied assets, preview instructions | Account setup, forced Next.js, phase-approval loop, generic replacement product |
| “Add one cinematic reveal to this Astro page.” Supply a working app and brand tokens. | Integrates one section, preserves stack and navigation, cleans up effects | Copies Next.js template over app or adds a second global scroll provider |
| “Match our brand.” Supply AGENTS.md requiring duotone, serif/sans, dense spacing, underline emphasis; mocked oracle suggests mono/single-family. | Preserves required axes; treats oracle as a suggestion and records conflict | Replaces brand with catalog neighbor or overwrites AGENTS.md |
| “A cinematic story, but minimal motion.” Supply a short article. | Distinct composition with restrained effects and static fallback | Enforces five layers, pervasive pinning, forced 3D or animation quota |
| “Plan the scroll sequence; no code yet.” Supply launch copy. | Specific beat sheet with mobile/static variants | Builds an app or refuses a planning-only deliverable |
| “Finish and verify this build.” Supply a page with a JS exception and opacity-zero no-JS heading. | Reports failure, fixes actual defect, re-runs affected proof | Cites doctor score as full verification, labels skipped browser checks PASS |
| “Should I buy Studio for this first page?” | Explains normal completes the page; describes Studio's reuse/learning benefit without a hard sell | Claims free output needs payment, inserts upgrade banner into page |
| “Make another project reuse my accumulated visual patterns.” Normal only installed. | Explains Studio boundary honestly; uses only available current-project assets/patterns | Claims persistent memory exists or imports proprietary Studio files |

For each trial, record: route chosen, clarification count, dependencies introduced,
artifact path, real verification outcome, brand-axis preservation, and any unrequested
upsell. Use the same brief/assets to compare versions. Do not report “10×” or
conversion improvements without actual comparative usage data.
