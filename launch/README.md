# 🚀 Cinematic Scroll — Launch Playbook

You finished a 9/10 product and never launched it. **1 star ≠ bad project — it means
nobody has seen it.** This folder is the launch. Work top to bottom.

> The diagnosis in one line: your entire value prop is *motion*, and every place people
> discover you was static or broken. Fix the wow → make it travel → spike it with a launch.

---

## 0. Pre-flight checklist

**Already done in this repo (code committed):**
- [x] Fixed the landing-page social card bug — `og:image` was a relative path (broken in every share). Now absolute, with full Twitter `summary_large_image` tags. → `index.html`
- [x] Killed the "no active maintenance commitment" line in the README (it told visitors "abandoned, don't invest").
- [x] Added legitimacy badges (npm, MIT, works-with, stars) + an outcome-led headline.
- [x] Generated a branded 1200×630 social card → `assets/social-card.png`.

**Only you can do these (do them before Day 1):**
- [ ] **Upload the GitHub social preview:** repo → Settings → General → Social preview → upload `assets/social-card.png`. (GitHub is still serving the generic auto-card; this is why shares look dead.)
- [ ] **Record the demo video** → `demo-video.md`. Non-negotiable; it's every channel's hook.
- [ ] **Commit + push** the changes in this repo, then `git tag v2.2.0` and write a Release note with the video embedded.
- [ ] Re-deploy GitHub Pages (push to `main`) so the new meta tags go live, then test the card → see §3.
- [ ] Set up / dust off your **X** profile (clear bio: "I build cinematic scroll sites · made @cinematicscroll"), pin nothing yet.

---

## 1. The 7-day launch sequence

Spread it out. A drip across a week beats one big day — each channel re-seeds the others, and momentum compounds.

| Day | Move | File |
|---|---|---|
| **Day 0 (prep)** | Upload social preview, record + cut video, push code, write the Release note. Test the OG card. | `demo-video.md` |
| **Day 1 (Sat)** | **r/webdev Showoff Saturday** + post the X thread. Saturday is the one day r/webdev welcomes self-promo. | `reddit.md`, `x-thread.md` |
| **Day 2 (Sun)** | LinkedIn + Bluesky/Threads repost of the hook. Reply to everything from Day 1. | `x-thread.md` |
| **Day 3 (Tue)** | **Show HN**, 8–10am ET. Clear your morning to answer every comment. | `show-hn.md` |
| **Day 4 (Wed)** | **Product Hunt**, 12:01am PT. Do the "drop a brief, I'll build it live" thread all day. | `product-hunt.md` |
| **Day 5 (Thu)** | r/nextjs + r/ClaudeAI + r/cursor (one post each, value-framed). | `reddit.md` |
| **Day 6–7** | Email the newsletters (JS Weekly, Frontend Focus, Bytes, TLDR). Open the awesome-list PRs. Quote-tweet the best community build. | `awesome-lists.md` |

**Never:** ask for upvotes, post identical text across subs in the same hour, or lead with the ask. Lead with the artifact every time.

---

## 2. Channel cheat-sheet

| Channel | Best day/time | The one rule |
|---|---|---|
| Show HN | Tue–Thu, 8–10am ET | Honesty + answer every comment fast. No hype words. |
| Product Hunt | Tue–Thu, 12:01am PT | Be present all day; the "build it live" promise drives ranking. |
| r/webdev | Saturday (Showoff) | Only in the Showoff thread, or it's removed. |
| X/Twitter | Tue–Thu, 9–11am ET | Native video in the hook. Hashtags in a reply, not the hook. |
| Newsletters | anytime | 2 lines + the video link. They want free OSS with a wow. |

---

## 3. Verify the share cards work (do this after deploy)

- **Twitter/X:** https://cards-dev.twitter.com/validator (or just paste the URL into a draft DM and watch the preview).
- **Facebook/OG debugger:** https://developers.facebook.com/tools/debug/ — paste `https://mustbesimo.github.io/cinematic-scroll-skill/`, hit "Scrape Again" to bust the cache.
- **LinkedIn:** https://www.linkedin.com/post-inspector/
- Confirm the **social card image renders** and the title/description are the new ones.

---

## 4. The x10 roadmap — bigger bets after launch week

Launch week gets you seen once. These make the project *keep* growing. In leverage order:

1. **Dogfood the landing page.** The homepage of a cinematic-scroll skill should itself be the most jaw-dropping scroll page a visitor has hit all week — built *with the skill*. "This site was made by the thing it's selling" is the proof and the story. Highest-leverage single project.
2. **The showcase wall.** A `/showcase` page (and README section) of sites people built with it. Add a "Submit your build" issue template. Other people's work becomes your marketing — this is the compounding loop. Seed it with your own 5 worlds + any client work.
3. **Live prompt gallery.** On the landing page: click a brief → see the generated site. Turns "trust me" into "watch." Pairs with the `examples/PROMPTS.md` you already have.
4. **SEO content engine (3–5 posts, canonical to your site, cross-posted to dev.to):**
   - "I made Claude build an Awwwards-style scroll site from one sentence (here's how)"
   - "GSAP is free now — here's the scroll system I build on top of it"
   - "The 5-phase pipeline that stops AI from designing generic landing pages"
   - "Scrollytelling without WebGL: multi-depth parallax with transform/opacity only"
   These rank for years and feed newsletters.
5. **Partnership surface.** You're already complementary to **GSAP** (you sit on top of it), **fal.ai** (your image pipeline), and **Cursor/Claude** (your host). A tweet from any of them = a star spike. Build genuinely useful integrations/posts and tag them honestly; offer to be a featured example.
6. **Templates as lead-gen.** Package 3–4 finished aesthetics as one-command starters. People who use a template become people who star, share, and hire.
7. **Build in public, weekly.** One "here's what I shipped / what someone built" post per week keeps the flywheel turning. Fame is a frequency game, not a one-shot.

---

## 5. What "working" looks like

- **Week 1:** 100–500 stars, a Show HN front-page or PH top-5, the OG card rendering everywhere.
- **Leading indicators that matter more than stars:** people posting sites they built, an unprompted mention in a newsletter, someone else opening a PR.
- **The real win:** "Cinematic Scroll" becomes the answer when someone asks "how do I make my AI build a *nice* site?" That's fame for a tool — being the default recommendation.

> Reality check: the artifact is already excellent. From here, every hour is better spent on
> distribution than on features. Resist the urge to polish the code more. Go get it seen.
