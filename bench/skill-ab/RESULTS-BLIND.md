# Results — blind (X / Y / Z)

Exploratory three-example comparison, one brief (Ferrymead Bakehouse), one attempt per
condition, `claude-sonnet-5`, fresh isolated sessions. No statistical claim is possible from
three builds. Single-sample numbers (turns, time, cost) are noisy. Open `blind/compare.html`,
scroll all three, write down your ranking + notes, then open `REVEAL.md`.

## Raw measurements

| Measure | X | Y | Z |
|---|---|---|---|
| Produced index.html, no external resources | yes / 0 ext | yes / 0 ext | yes / 0 ext |
| File size (bytes) | 14890 | 25468 | 20715 |
| page-proof matrix (5 profiles: desktop, mobile, ×reduced-motion, no-JS) | all CLEAN | all CLEAN | all CLEAN |
| Independent probe 390 px (overflowX / clipped text / p<15px) | 0px / 0 / 2 | 0px / 0 / 5 | 0px / 0 / 6 |
| Independent probe 1440 px (overflowX / clipped text / p<15px) | 0px / 0 / 2 | 0px / 0 / 5 | 0px / 0 / 6 |
| Brief phrases verbatim (case-insensitive, 22) | 0 missing of 22 | 3 missing of 22 | 4 missing of 22 |
| prefers-reduced-motion queries in CSS | 2 | 2 | 4 |
| Agent turns / wall time | 8 / 178 s | 28 / 308 s | 8 / 173 s |
| Reported cost (USD, CLI) | 0.344 | 0.713 | 0.427 |
| cinematic-doctor score (skill's own rubric — biased, info only) | 80 | 85 | 80 |

Reading the table: page-proof and the probe find **no runtime errors, no horizontal overflow
and no clipped text in any build** at either width — the deterministic checks do not separate
them. "p<15px" counts paragraphs under 15 px (small print/labels count; heuristic).

## Evaluator's visual notes (Claude, not blind — I built the harness and can infer which is which)

- **X** — Editorial, restrained, list-based; three thin tide-line SVGs behind the hero. Defect:
  the skip-link is not fully hidden — a dark sliver shows at the top-left corner at both widths
  (`top:-3rem` shorter than the link). Hero wave lines cross through the paragraph text on mobile
  (minor legibility). No invented copy; section headings are the brief's own names.
- **Y** — Card-based, more "designed" (bread illustrations, timeline, map squiggle, dark closing
  band). Decorative ferry-hall silhouette sits behind hero body text (minor legibility). Adds
  invented copy beyond the brief: "A standing order, easily paused", "Built for ferries, kept for
  bread", "Come by the water", "One email gets you on the list — no forms, no fuss" (an invented
  promise), extra buttons "See the loaves", "Plan a visit". Dates restructured into a timeline
  (phrases not verbatim).
- **Z** — Full-viewport chapters with CSS scroll-timeline reveals, no JavaScript at all; line-art
  ferry hall. At 1440 px several depths show a mostly empty viewport (a faint quote alone, a dim
  teal band) before content resolves — reads as dead space in a static frame; the filmstrip shows
  this. Adds invented copy: "A ferry terminal, slowly.", "Four things, baked well.", "Join the
  tide", "your call". Dates restructured; "Open Friday to Sunday, 7am…" split across elements.
  Possible sticky-header scroll-state glitch after scroll-up (not confirmed; unscrolled shot is fine).

Capture caveat: full-page stitched screenshots misrepresent Z (scroll-linked reveals render at
zero progress), so all comparisons use viewport screenshots at six depths. This is itself a
measurement lesson: fullPage captures are not a valid check for scroll-driven pages.
