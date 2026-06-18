# 🚀 GO-LIVE — do this, in this order

Everything is built. This is the shortest path from "polished files on disk" to
"live + launched + seen." ~2 hours of real work, spread across one week.

The landing page is already swapped: `index.html` is now the cinematic page (the old
one is saved as `index.legacy.html`). NOTE: `index.v2.html` is an **earlier iteration**
that has since diverged from `index.html` (different size/content) — it is **not** a
copy. Treat both `index.v2.html` and `index.legacy.html` as superseded backups; delete
them only deliberately (see cleanup below), knowing you lose those older snapshots.

---

## STEP 1 — Ship the repo (5 min)

```bash
cd "/Users/simoneleonelli/Documents/_Code/cinematic-scroll-skill"

# optional cleanup: the v2 file is now redundant; keep one legacy backup or drop both
git rm index.v2.html
# git rm index.legacy.html      # only if you don't want the old page in history's tip

git add -A
git commit -m "Cinematic landing rebuilt with the skill; portable-skill narrative; social card + meta"
git push
```

Pushing to `main` auto-redeploys GitHub Pages, so the new homepage goes live within a minute.

> Don't commit `video/node_modules/` or the 4K render if it's huge — both are gitignored. The README video is hosted via Step 2, not committed.

---

## STEP 2 — Turn on the visuals (10 min, GitHub web — only you can do these)

1. **Social preview:** repo → **Settings → General → Social preview → Upload** → `assets/social-card.png`. (Until this, link shares show GitHub's generic card.)
2. **README video:** open `README.md` in the github.com editor (pencil), **drag `assets/demo-loop.mp4` into the text box** at the very top. GitHub hosts it and inserts an inline player — no repo bloat. Commit.
3. Confirm the live page looks right: open https://mustbesimo.github.io/cinematic-scroll-skill/ and scroll all three pinned chapters + the morph.

---

## STEP 3 — Verify the share cards (3 min)

Paste `https://mustbesimo.github.io/cinematic-scroll-skill/` into each:
- X: https://cards-dev.twitter.com/validator
- Facebook (forces a re-scrape): https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/

You want the new social card + the "give any agent the taste…" title to show.

---

## STEP 4 — Launch week (the copy is all written in `launch/`)

| Day | Move | Use |
|---|---|---|
| **Day 1 (Sat)** | r/webdev **Showoff Saturday** + post the X thread (hook A) | `launch/reddit.md`, `launch/x-thread.md` |
| **Day 2 (Sun)** | LinkedIn + Bluesky repost of the hook; reply to everything | `launch/x-thread.md` |
| **Day 3 (Tue)** | **Show HN**, 8–10am ET — clear your morning to answer every comment | `launch/show-hn.md` |
| **Day 4 (Wed)** | **Product Hunt**, 12:01am PT — do the "drop a brief, I'll build it live" thread | `launch/product-hunt.md` |
| **Day 5 (Thu)** | r/nextjs + r/ClaudeAI + r/cursor (value-framed, one each) | `launch/reddit.md` |
| **Day 6–7** | Email newsletters (JS Weekly, Frontend Focus, Bytes, TLDR) + open awesome-list PRs | `launch/awesome-lists.md` |

The spine of every post is `launch/NARRATIVE.md`: *agents can code, not art-direct → taste packaged as a portable skill → works in any agent → free.*

---

## STEP 5 — Keep the flywheel (after launch)

- Post one "here's what I shipped / what someone built" update per week.
- Stand up the showcase wall + a "submit your build" issue template once builds come in.
- Consider the interactive "describe → preview" demo and a second craft skill (the suite play) — both compound now that you're live.

---

## The 5 things only you can do
1. `git push` (Step 1).
2. Upload the social preview (Step 2.1).
3. Drag the video into the README (Step 2.2).
4. Actually post — X, HN, PH, Reddit (Step 4).
5. Reply fast to every early comment. Engagement velocity = ranking.

## Never
Ask for upvotes · post identical text across subs in the same hour · lead with the ask. Lead with the artifact, every time.
