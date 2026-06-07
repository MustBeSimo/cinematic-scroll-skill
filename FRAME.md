# FRAME.md — Cinematic Scroll, directed for the 16:9 frame

> `design.md` describes the brand. `frame.md` directs the composition.
> This file translates the cinematic-scroll design system for video agents
> (HyperFrames or any HTML-to-video runtime): same tokens, same taste rules,
> re-derived for a frame the viewer cannot scroll.
> Companion to `SKILL.md` (the scroll grammar) and `taste-guardrails.md`
> (the banned-patterns list — it applies to video too).

---

## 1. Identity

- **Product:** Cinematic Scroll — a free, MIT Agent Skill that builds scroll-driven
  cinematic websites. The brand voice is *editorial, confident, restrained*:
  museum placard, not landing-page hype.
- **Tagline register:** declarative sentences, no exclamation marks.
  ("The motion is the constant. The look is yours.")
- **The brand has two finishes.** Default to Petroleum Editorial (dark) for video;
  Swiss Museum (light) is the alternate.

## 2. Palette

### Petroleum Editorial (dark — default for video)
| Token | Hex | Frame role |
|---|---|---|
| BG | `#101417` | Frame background, letterbox fills |
| Surface | `#1B2026` | Cards, code panels |
| Elevated | `#202A31` | Hover/lifted panels |
| Ink | `#E9E1D4` | Display type, primary text |
| Muted | `#8B857B` | Secondary text, captions, figure labels |
| Brass | `#8F6A38` | THE accent — eyebrows, rules, key words. Use sparingly |
| Oxblood | `#5A2328` | Secondary accent — chapter punctuation only |
| Petrol | `#1E3A3E` | Atmosphere gradients |

### Swiss Museum (light — alternate)
Paper `#F4EFE6` · Bone `#DED5C8` · Carbon `#1E2326` · Smoke `#6F6A63` ·
Brass `#8F6A38` · Burgundy `#6A3037`.

**Rule:** one accent family per scene. Brass leads; oxblood punctuates. Never both
as co-equal accents in the same shot.

## 3. Typography (at 1920×1080)

| Role | Face | Size at 1080p | Treatment |
|---|---|---|---|
| Display | Cormorant Garamond 600 | 96–180px | UPPERCASE, letter-spacing +0.01em, line-height 1.02 |
| Sub/lede | Cormorant Garamond 500 | 44–56px | Sentence case, Ink at 90% |
| Label / eyebrow | Space Mono | 22–26px | UPPERCASE, letter-spacing 0.22em, Brass |
| Code | Space Mono | 30–36px | On Surface panel, Ink; brass `$` prompt |
| Caption / fig | Space Mono | 20px | Muted, bottom-third only |

Minimum body size on frame: **28px** (mobile feeds shrink the frame; smaller is
illegible). Max 2 faces per scene — Cormorant + Space Mono is the whole system.

## 4. Motion grammar (video translation of the scroll grammar)

Easings — same curves as the scroll system (`taste-guardrails.md` §4.1):
- **Entrances:** `cubic-bezier(0.16, 1, 0.3, 1)` — long settle, "the reveal"
- **Exits:** `cubic-bezier(0.7, 0, 0.84, 0)` — clean acceleration away
- **Scene cuts:** `cubic-bezier(0.87, 0, 0.13, 1)` — weighty, deliberate
- Never `linear` or default `ease` on a visible move.

Signature moves (use ≥2 per video, named in code comments):
- **Word-stagger title** — words rise 30–40px + fade, 0.08s offset
- **Letter-spacing settle** — tracking 0.4em → 0.02em on display type
- **Slow push-in** — image scale 1.00 → 1.06 across a whole scene (Ken Burns,
  one direction only)
- **Background morph** — BG crossfades between palette atmospheres at scene cuts
- **Mono-card slide** — Space Mono UI card enters x:+40 → 0 with brass tag first

Banned in-frame (inherits `taste-guardrails.md` §1): no animated `filter`/blur,
no spinning logos, no bounce easings on display type, no more than 3 simultaneous
motion types per shot, no uniform easing across a whole scene.

## 5. Pacing for the frame

The scroll page lets the user set the tempo; video must breathe for them.
- **Scene dwell:** minimum 4s, maximum 14s per scene at 60s total.
- **Title hold:** a display title holds fully-composed ≥1.8s before anything exits.
- **Code on screen:** ≥1.2s per line of code, plus 0.8s settle before cut.
- **Cut rhythm:** vary scene lengths (e.g. 8s / 12s / 10s / 14s / 9s) — uniform
  cuts read as slideshow, not cinema.
- **Cold open:** first meaningful image/words inside 1.5s. No logo stings.

## 6. Composition rules

- 16:9 master frame 1920×1080. Title-safe inset: 96px all sides.
- Asymmetry is the house style: type left-weighted (x:120–960), imagery
  right-weighted, generous negative space. Center only single-line display
  statements.
- Figures get the **frame treatment**: thin Brass corner brackets + Space Mono
  `FIG. XX` caption, exactly like the scroll examples.
- Letterbox bars (when used): pure BG, never black-on-dark-grey.
- End card: repo URL in Space Mono, brass underline rule, ≥3s hold.

## 7. Imagery

Use the skill's own generated showcase art (`assets/*.jpg`) or stills from the
two live examples — never stock. Monochrome stills may carry one accent tint.
AI-generated imagery must follow the skill's hygiene rule: **no baked-in text,
no logos, no real products** (see `SKILL.md`).

## 8. Audio (optional)

If scored: sparse, sub-100 BPM, no risers/whooshes on every cut (one subtle
transition sound per scene max). Mix dialogue/VO at −14 LUFS, music −24 LUFS
under VO. Silence is acceptable and on-brand.

---

*Files that travel with this spec:* `taste-guardrails.md` (banned patterns),
`references/film-archetypes.md` (director grammars — pick ONE per video),
`video/ship-in-5/` (the reference composition built from this FRAME.md).
