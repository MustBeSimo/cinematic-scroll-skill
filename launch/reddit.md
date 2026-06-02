# Reddit

Reddit is allergic to marketing and ruthless about it. Frame everything as "I made this,
here's how it works, it's free, tear it apart." Lead with the artifact, never the ask.
Read each sub's rules before posting — several require a flair or a specific day.

> One account, spaced out. Don't blast all subs the same hour — it reads as spam and gets you shadow-flagged. One sub per day across launch week.

---

## r/webdev — "Showoff Saturday" (read the weekly thread rules)
**Title:**
> [Showoff Saturday] I made a free skill that turns one sentence into a cinematic scroll site (MIT)

**Body:**
> I build scroll-driven sites and wanted my AI agent to produce the *motion* (pinned chapters, parallax, scroll-linked 3D), not just another centered hero. So I built a free Agent Skill for Claude/Cursor that runs the model through a film pipeline + taste guardrails and outputs either a single `.html` file or a full Next.js site.
>
> Five live demos, one engine, deliberately different looks: https://mustbesimo.github.io/cinematic-scroll-skill/
> Repo (MIT): https://github.com/MustBeSimo/cinematic-scroll-skill
>
> All vanilla-JS/rAF in the standalone files, transform/opacity-only, reduced-motion fallback. Happy to answer anything about the motion approach or the perf budget.

---

## r/nextjs
**Title:**
> Free MIT skill: scaffold a full cinematic Next.js release page (GSAP ScrollTrigger + Lenis) from a prompt

**Body:**
> The Mode B template is a tested Next.js App Router project: ScrollTrigger + SplitText for pinning/title reveals, Lenis for smooth scroll, an optional fal.ai route for chapter art, and a vanilla fallback for sandboxes. You describe the aesthetic and your agent fills in the chapters.
>
> Template + 5 live demos: https://github.com/MustBeSimo/cinematic-scroll-skill
> Curious what folks think of the component split (ChapterScene / EditionsPage / SmoothScrollProvider).

---

## r/SideProject
**Title:**
> I spent weeks turning "make AI build beautiful scroll sites" into a free skill — here's the result

**Body:**
> Honest build-in-public post. The hard part wasn't the animation — it was stopping the AI from producing generic slop, so most of the work went into a 5-phase pipeline + taste guardrails. It's free and MIT. Five live worlds to scroll, no install: [link]. Feedback very welcome, including the harsh kind.

---

## r/ClaudeAI  and  r/cursor
**Title:**
> Made a free skill that gives Claude/Cursor the ability to art-direct cinematic scroll websites

**Body:**
> Install: `npx cinematic-scroll-skill` (or `/plugin marketplace add MustBeSimo/cinematic-scroll-skill` in Claude Code). Then just describe a site — "a noir scroll page for a sci-fi game, teal fog, crimson edge-light" — and it builds it with pinned chapters, parallax, and a scroll-linked 3D camera. Five live examples + repo: [link]. It's MIT. Would love to hear what you build.

---

## Optional: r/web_design, r/Frontend, r/graphic_design (design-leaning framing)
Lead with the **video**, minimal text: "Made a free tool that turns a one-line brief into a scrollable cinematic site — same engine, any aesthetic. [video] Demos + code: [link]."

---

## Rules that bite (check before posting)
- **r/webdev:** self-promo only in Showoff Saturday or with substantial discussion; pure links get removed.
- **r/nextjs / r/Frontend:** must add value/discussion, not just "check out my repo."
- **No upvote begging, no crossposting the identical text** within minutes.
- Reply to every comment. Reddit ranks on early engagement + dwell time too.
