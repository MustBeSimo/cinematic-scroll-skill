# Studio — brutalist creative-director portfolio ("The Cut")

A worked example for **cinematic-scroll** in a **Swiss / brutalist editorial**
world: oversized grotesk type, monochrome stills, one electric-blue accent.
Fictional persona (**Maya Torres**), no real people or brands.

**One idea, all the way down: the portfolio is a film edit and the scroll is the
playhead.** A fixed *deck* reads live timecode / frame count / reel number
computed from scroll depth; chapters **cut** (not dissolve) between grey, paper
and ink grounds; and the signature moment — *Selected work* — runs as a pinned
four-frame **reel**: hard cuts between full-bleed frames, letters rising from
in-frame progress, a scrubber across the bottom. Two frames are stills, two are
procedural artwork built in the page (an SVG bar-field identity, a CSS poster
triptych) — no blank cards anywhere.

Single self-contained `index.html` — zero dependencies, system font stacks,
no build step, GitHub-Pages-native. The markup is static: with JS off you still
get every chapter and all four reel frames in flow.

## Motion

One rAF scroll clock (`lerp` toward the scroll target, cheap geometry cached off
the hot path) drives everything, transform/opacity only:

- **Slate** — the name rises letter by letter once (nocturne gesture 1);
  the portrait drifts under it as the page starts.
- **Belief** — words slide in on opposite axes (gesture 2).
- **The reel** — sticky stage over a 320vh track; `--f` (in-frame progress) is
  the only variable each frame's CSS reads: push-in on the still, per-letter
  rise on the title, bar-field stretch, poster drop. Frames switch with a hard
  cut. Reduced motion / narrow / no-JS: the stage is a stacked contact sheet.
- **Craft** — tracking stretches with scroll (gesture 3).
- **Recognition** — the type *is* the image: it scales up into place (gesture 9).
- **Invitation** — the headline is the mailto; a visible CTA repeats it.
- **Colour** — `--bg / --fg / --fg-dim / --line` are mixed per frame from the
  token palette; each section boundary is an 8vh cut so text and ground always
  switch as a pair and contrast never dips.

Tokens: the six colour roles and the four motion curves from `tokens/` are
declared in `:root`; every declaration references a `var()`.

## Run it

```bash
python3 -m http.server 8099    # then open http://localhost:8099/examples/studio/
# …or just open index.html directly.
```

The six stills in `assets/` are already generated. To regenerate them:

## Generate the images (needs fal.ai access)

The Cowork sandbox can't reach fal.ai, so run this on a machine that can
(e.g. Claude Code on your Mac):

> **Your `FAL_KEY` is a billable secret.** Keep it in `.env.local` (already
> gitignored), never paste it into source, prompts, or chat, and never commit it.
> Anyone with the key can spend your fal.ai credits. Rotate it at
> <https://fal.ai/dashboard/keys> if it's ever exposed.

```bash
# 1. put your key in a gitignored .env.local (this folder or repo root):
#    (.env.local is gitignored by default — never commit a real key)
echo 'FAL_KEY=xxxxxxxx:xxxxxxxx' > .env.local

# 2. preview the prompts (no cost):
node generate.mjs --dry-run

# 3. generate all 6 (~$0.90 on Nano Banana Pro):
node generate.mjs

# regenerate just one if a still has baked-in text/logo:
node generate.mjs --only 4-recognition
```

Images land in `assets/<id>.jpg`; `index.html` references them by path (all six
are used exactly once — portrait, studio, product, storyboards, trophy, paper).

- **Model:** Nano Banana Pro (`fal-ai/gemini-3-pro-image-preview`), ~$0.15/img.
  Use the cheaper Nano Banana 2 with `MODEL=fal-ai/gemini-3.1-flash-image-preview node generate.mjs`.
- **Prompts** live in `chapters.js` (the generator's data + a readable map of
  the page). The page's markup is static, so keep copy in sync by hand.
- **Hygiene:** every prompt forces pure B&W and forbids text/logos/real brands.
  Still, eyeball each result — regenerate any that slip.

## Files

| File | What |
|------|------|
| `index.html` | The page — self-contained motion engine + layout |
| `chapters.js` | Chapter copy + image prompts for the generator, and a readable map of the page (not imported by it) |
| `generate.mjs` | fal.ai image generator (run on a networked machine) |
| `assets/` | The six generated stills (`<id>.jpg`), each used once by the page |
