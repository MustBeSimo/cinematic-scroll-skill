# Skill A/B/C — frozen protocol (exploratory, three builds)

Written and committed BEFORE any build ran. Nothing below changes after the runs.

## Question
For one brief, does the frozen skill change the built page — for better, worse, or
not detectably — versus (A) an ordinary clear prompt and (B) a competent expert
prompt, with the same model, tools and caps? This is an exploratory three-example
comparison. It cannot establish significance, reliability or general value.

## Target
- Skill: `cinematic-scroll` v2.7.6, repository commit `c79a744` (tracked files only,
  exported with `git archive`; `node_modules` symlinked so the skill's own node tools
  can run). The stale global install (v2.5.1) is NOT loaded in any arm.

## Conditions (one build each, fresh isolated headless session)
- A: `prompt-A.txt` — ordinary clear prompt + brief.
- B: `prompt-B.txt` — expert prompt written by the evaluator before any build, without
  reading the skill for this purpose (it reflects general craft knowledge only).
- C: `prompt-C.txt` — prompt A wording + the frozen skill provided at `./skill/`.
  Skill content is offered as an installed skill the agent is told to read; whether
  it reads referenced files/runs tools is the agent's choice, as in real use.

## Held constant
- Model `claude-sonnet-5`, `claude -p`, `--setting-sources ""` (no user/project
  settings, hooks, CLAUDE.md or global skills), `--strict-mcp-config` with no MCP
  servers, tools Read/Write/Edit/Bash/Glob/Grep only (no WebFetch/WebSearch/Skill/
  Agent), `--max-turns 40`, `--max-budget-usd 6`, `--permission-mode bypassPermissions`.
- Same brief, same copy, no assets (CSS/SVG/canvas only), one self-contained
  `index.html`. Working dir contains only `brief.md` (+ `skill/` for C).
- One attempt per condition. No re-runs, no repair cycles, poor results kept.

## Measurements (one lightweight pass per build)
Neutral/deterministic (reported as-is):
1. `page-proof` matrix, 5 profiles (desktop, mobile, both reduced-motion, no-JS), shots at
   0/0.5/1 — console/runtime errors, layout check (overflow, hidden essentials, h1).
   The tool is from the skill repo, but its checks are generic; noted anyway.
2. Copy fidelity: every brief sentence present verbatim (grep), external URLs = 0.
3. File size (bytes), turns, cost (USD as reported by the CLI), wall time.
Skill-native (biased toward C, reported but not used for the verdict):
4. `cinematic-doctor` score.
Human, blind:
5. Side-by-side screenshots labelled X/Y/Z via a random mapping sealed in
   `blind-map.json` before the user looks. The user is the skill's author and not an
   independent reviewer; their preference is recorded as such.

Noisy by nature: cost/turns/wall time (single sample); doctor (rubric = skill's own);
any aesthetic judgement.

## Verdict rule
Per measurement: improved / worsened / inconclusive for C vs A and C vs B. No
aggregate score. Cases where C loses are reported identically to cases where it wins.
