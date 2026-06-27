# Learning Rubric — scores + abstraction tests

The agent assigns these (no model/embedding dependency in Phase 1). All scores are `[0,1]`.

| Score | Question | High means | Low means |
|---|---|---|---|
| `confidence` | Did I understand the mechanism correctly? | mechanism is clear and verified in-page | guessed from a screenshot |
| `novelty` | How different from canon + shelf? | nothing comparable exists | near-duplicate of an existing entry |
| `originality_risk` | How close to source-specific execution? | fully abstracted, principle-level | smells like the source's exact build |
| `reuse` | Telemetry (Phase 2) | — | stays `null` in Phase 1 |

**Abstraction tests (must all hold to write an entry):**

1. **Re-describable without source** (`redescribable_without_source: true`) — explain the recipe with the tab closed.
2. **Re-implementable from principle** — a fresh build, not a transcription.
3. **No source fingerprints** — no brand names, class names, copy, or asset URLs.
4. **Generalizes** — `applicability.best_for` lists contexts beyond the source.

A high `originality_risk` (≳0.6) means abstract further or reject (reason `firewall`).
