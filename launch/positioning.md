# Positioning Bible — Cinematic Scroll

The single source of truth for how we talk about this. Every headline, tweet, and
README line should ladder back to one of these.

---

## The one-liner (use everywhere)

> **Make Claude build cinematic, scroll-driven websites — from one sentence.**

Variants, ranked by surface:

1. **Default / README / landing** — "One sentence in. A cinematic, scroll-driven website out."
2. **Dev / HN** — "A free Agent Skill that gives Claude, Cursor & Hermes the taste and process to art-direct a whole scroll site — not just snippets."
3. **Design / X** — "Your AI can already write code. This teaches it to *art-direct*."
4. **PH / general** — "The free skill that turns one prompt into an Awwwards-grade scroll site."

> ⚠️ "Awwwards-grade" is an aspiration framing — the *quality bar we aim at*, not a claim of having won. Use it as ambition ("the kind of site that wins awards"), never as a credential.

---

## The wedge (why this exists)

Three things are true at once, and the gap between them is the whole opportunity:

- **AI agents build generic sites.** Ask Claude for a landing page and you get a centered hero, three feature cards, a footer. Competent. Forgettable.
- **Motion is what makes a site feel expensive.** Pinned chapters, multi-depth parallax, scroll-linked cameras — the stuff agencies charge $20k+ for. Agents don't reach for it because it needs *taste and sequencing*, not just syntax.
- **The tools are now free.** GSAP went 100% free in 2025 (Webflow). The motion primitives are sitting right there, unused by 99% of AI output.

**Cinematic Scroll closes the gap:** it hands the agent a film-grammar process (audit → storyboard → spec → build → polish), taste guardrails so it doesn't produce slop, and tested templates. The agent stops writing snippets and starts art-directing.

### The sharpened wedge

Cinematic Scroll is **not a prompt pack. It is a craft contract**: plan the motion, build the scene, compile it to web *and* video, then run a doctor that catches cinematic slop before it ships. Most cinematic-web skills stop at prompting. This one makes craft:

- **Measurable** — `cinematic-doctor` scores any build 0–100 (taste / performance / a11y / mobile / 3D) and exits non-zero below threshold, so quality is CI-gated, not a vibe.
- **Portable** — one craft skill that rides across Claude, Cursor, Hermes, OpenClaw (AGENTS.md, `.cursor/`, `.codex/`, `.claude/`) on top of npm + plugin channels.
- **Multi-media** — one `scroll-choreography.json` compiles to the website *and* its launch film.

Proven by a **3D/WebXR flagship** (`examples/flagship/`): four chapters, four 3D modalities, scoring 100 on the doctor.

---

## Messaging pillars (every asset uses ≥1)

| Pillar | The line | Proof |
|---|---|---|
| **Range** | "The motion is the constant; the look is yours." | 5 live clashing worlds from one engine |
| **Not slop** | "Process over prompt." | 5-phase pipeline, taste guardrails, transform/opacity perf budget |
| **Zero friction** | "One `.html` file, no build, no keys." | Mode A runs from `file://` |
| **Zero cost** | "Free, MIT, commercial use. GSAP is free now too." | LICENSE + GSAP/Webflow 2025 |
| **Real range of output** | "Instant section → full Next.js release site with AI art." | Mode A + Mode B + fal.ai pipeline |

---

## Audience segments (who to aim each channel at)

- **Creative devs / the Awwwards crowd** → X/Twitter, the demo video. They share beauty.
- **Indie hackers / builders** → Show HN, r/SideProject. They value free + technical honesty.
- **Claude / Cursor power users** → r/ClaudeAI, r/cursor, agent-skill directories. They want capabilities.
- **Freelancers / small agencies** → "ship client sites 10x faster." LinkedIn, design subs.
- **Next.js / React devs** → r/nextjs, awesome-nextjs. The Mode B template is the hook.

---

## Naming & category

- **Product name:** Cinematic Scroll (keep — it's clear and ownable).
- **Lead with the *outcome*, not the *category*.** "Agent Skill" is nascent and has near-zero search demand; "cinematic scroll website" is what people actually want. Say what it makes first, what it *is* second.
- **Always name the agents** (Claude · Cursor · Hermes). "Works with Claude" is a discovery keyword and a trust signal.

---

## Words we use / words we avoid

- **Use:** art-direct, motion grammar, pinned chapters, cinematic, taste, release page, one sentence, free, MIT.
- **Avoid:** "revolutionary", "AI-powered" (everything is), "stunning" (show, don't say), "leverage", "solution". Let the demo carry the wow; keep the copy plain.

---

## The proof stack (lead with whichever fits the surface)

1. **The video** — prompt → site. (Strongest. Build this first; see `demo-video.md`.)
2. **Five live worlds** — clashing aesthetics, one engine. (Best "range" proof.)
3. **It's free + MIT** — removes the last objection.
4. **The pipeline + guardrails** — for skeptics who assume AI = slop.
