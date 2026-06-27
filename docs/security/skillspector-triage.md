# SkillSpector triage — ClawHub bundle

[NVIDIA SkillSpector](https://github.com/NVIDIA/skillspector) is a security scanner for
agent skills (prompt injection, data exfiltration, privilege escalation, dangerous code,
etc.; risk score 0–100). We run it against the **ClawHub export bundle** before publishing.

## Result

- **Raw scan** (`skillspector scan dist/clawhub-export --no-llm`): `score 100 · CRITICAL`,
  28 findings — **all reviewed as false positives** (see below). SkillSpector's heuristics
  are tuned to catch *malicious* skills; they keyword/AST-match a legitimate, fully
  permission-disclosed web-design toolkit.
- **With the reviewed baseline** (`--baseline .skillspector-baseline.yaml`):
  `score 0 · LOW · SAFE · 0 active · 28 suppressed`.

One finding was removed **structurally** rather than suppressed: `tools/skill-sync.mjs`
(a maintainer-only tool that syncs this skill's own `.codex`/`.cursor` pointer stubs) is
excluded from the bundle — it is not a runtime capability. That dropped the 2 "Agent
Snooping / Skill Enumeration" flags. `audit-mode.md` + `learn-mode.md` were added so the
published agent contract is complete; they introduced **no** new findings.

## Why every remaining finding is a false positive

| Category (count) | What SkillSpector matched | Why it is not a vulnerability |
|---|---|---|
| **Privilege Escalation / Credential Access (13)** | `.env.local` / `FAL_KEY` strings in `manifest.json`, `tools/check-consistency.mjs`, `tools/heygen/*`, `tools/promo/*` | Correct credential *handling*, not theft. `manifest.json` documents storing the billable `FAL_KEY` in a **gitignored** `.env.local`; `check-consistency.mjs` literally **scans for leaked `.env` files** (a security control); the optional, user-initiated fal.ai/HeyGen scripts read the key from `process.env`. Nothing is harvested or transmitted. All disclosed in `manifest.json → security.thirdPartyNetworkCalls` and the SKILL.md frontmatter `permissions`. |
| **Prompt Injection / Hidden Instructions (11)** | HTML comments in generated templates, e.g. `<!-- chapter: … LAYOUT IS YOURS: reposition the [data-layer] elements freely … -->` in `compile-choreography.mjs` + `components/mode-a/*.html` | Author-facing guidance comments inside **generated output**, helping a human/agent art-direct the page. They are not instructions smuggled to an agent to take unauthorized action. |
| **System Prompt Leakage / Direct Prompt Extraction (2)** | the phrase "print prompt" in `tools/promo/gen-flythrough-assets.mjs`, `gen-theme-heroes.mjs` | These print the **fal.ai image-generation prompt** (the text-to-image art prompt), not a system prompt or internal instructions. |
| **Excessive Agency (2)** | `LICENSE` ("INCLUDING BUT NOT LIMITED TO"); `taste-guardrails.md` ("without consent") | MIT license boilerplate; and a **safety guardrail** (5.6 — "Never force VR locomotion or move the user *without consent*"), i.e. the opposite of a vulnerability. |

## Re-verify / re-triage

```bash
# build the bundle (see "Publishing a new version" in COMPATIBILITY.md), then:
skillspector scan "$EXPORT" --no-llm --baseline .skillspector-baseline.yaml   # expect SAFE
```

The baseline matches specific findings, so a **new** issue in any of these files still
surfaces. If new findings appear, triage them here and regenerate the baseline
(`skillspector baseline "$EXPORT" --no-llm -o .skillspector-baseline.yaml`) only after
each is confirmed benign. Do **not** baseline an unreviewed finding.
