# Reveal — open only after recording your blind ranking

| Label | Condition |
|---|---|
| X | **B** — competent expert prompt, no skill |
| Y | **C** — frozen skill v2.7.6 (`c79a744`) |
| Z | **A** — ordinary clear prompt |

## What the skill (C) changed for this brief — versus A and versus B

Improved (C over A):
- Fewer copy deviations (3 vs 4 phrases non-verbatim) — marginal.
- No empty-viewport moments at 1440 px; every scroll depth shows content. A's CSS
  scroll-timeline chapters leave dead frames.
- Richer visual system (illustrated loaf cards, timeline, map motif, closing band) — this is
  an aesthetic judgement, not a measurement; the blind rating is the only evidence that counts.

Worsened (C versus B):
- Copy fidelity: B kept all 22 phrases verbatim and invented nothing; C rewrote section
  headings and added an unbriefed promise ("One email gets you on the list — no forms, no
  fuss"). The brief forbade invention. This is the one clear, deterministic loss for C.
- Cost/time: 28 turns, 308 s, $0.71 versus 8 turns, 178 s, $0.34 — roughly 2× for the
  skill's read-and-verify loop. Single sample; noisy, but the direction is expected.
- File size: 25.5 KB versus 14.9 KB.

Worsened (C versus A): cost/time/size as above (A: 8 turns, 173 s, $0.43, 20.7 KB).

Inconclusive / tied:
- Runtime: all three CLEAN across five page-proof profiles; no overflow, no clipped text at
  390 or 1440 px in the independent probe. The deterministic checks do **not** separate the
  conditions on this brief. The "skill prevents broken builds" hypothesis is untested here —
  none of the three builds broke.
- Accessibility basics: all have one h1, reduced-motion handling, no-JS readability. B has a
  visible skip-link sliver (a defect the skill build does not have); C has decorative art
  behind hero text. Neither was caught by any automated check.
- Doctor: 85 vs 80 vs 80 — the skill's own rubric, expected to favour C; not evidence.

## Conclusion for this brief
The skill did not produce a measurably more correct page than a competent expert prompt; it
produced a more elaborate one at ~2× cost, with worse adherence to the "use copy verbatim, do
not invent" constraint. Whether it *looks* better is the open question and rests on the blind
rating (author-rated, so not independent). Against the ordinary prompt, the skill's build
avoided A's dead-viewport chapters, which is a real but single-instance difference.

Nothing here supports a general "skill beats an LLM alone" claim, and nothing refutes it.
The current YouTube description wording ("not a benchmark proving that the skill beats an LLM
alone") remains the accurate statement.

## Spend
Three builds: $0.344 + $0.713 + $0.427 = **$1.48** as reported by the CLI, plus two Haiku
smoke tests (~$0.10). No paid tools or services. Everything ran on existing local access.

## Not done (blocked or out of scope by instruction)
- Independent human rating (you are the author). An outside reviewer would need the same
  `blind/compare.html`; not contacted.
- Holdout runs, repeated runs, other briefs, other models: none, per the three-build cap.
