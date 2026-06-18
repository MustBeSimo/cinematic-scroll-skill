# Evals

Turns "the skill has taste / triggers correctly" from a claim into a number.

```bash
npm run evals:run                                   # deterministic: golden fixtures + trigger-set shape
node evals/run.mjs --target build.html --spec mode-a-pinned-chapter   # score an agent-built file
```

## What runs deterministically (CI)

- **Golden fixtures** (`golden.json` → `goldenFixtures`) — committed reference outputs (the
  component library) are asserted every run: doctor score ≥ threshold + required content
  (`prefers-reduced-motion`, `var(--ease…)`) + banned-pattern absence (`filter: blur(`,
  `transition: all`). These double as regression anchors.
- **Trigger-set shape** — `trigger.json` is validated (every case has `query` + boolean
  `should_trigger`).

## What needs an LLM judge (not deterministic)

- **Triggering accuracy** — run `trigger.json` (10 should-fire + 10 near-miss negatives)
  against the frontmatter `description` with an LLM judge (e.g. skill-creator `run_loop`).
  Targets: recall ≥ 0.9 on positives, precision ≥ 0.9 on negatives. Tune the description
  until both clear.
- **Build specs** (`golden.json` → `buildSpecs`) — have an agent satisfy each prompt, then
  score the output: `node evals/run.mjs --target <built> --spec <id>`. Includes an
  anti-pattern trap that must trigger a guardrail redirect, not a literal blur animation.

## Self-critique

The deterministic self-critique loop is the **verify orchestrator** (`npm run verify -- <file>`)
— an agent runs it on its OWN output before shipping (doctor + page-proof + contract gates).
Taste-level self-critique (does the build match the promised story?) is the LLM-judge layer
above. Together: machine-checkable craft + judged taste.
