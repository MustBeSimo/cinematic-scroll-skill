# progress.md

## Current state (2026-06-24)

Cinematic-scroll-skill v2.5.0 is shipping with:
- Asset Direction (Phase 1.5) + the Wow Gate — world-before-layout, wow made reproducible
- Three scroll-scrubbed 3D fly-throughs (gallery / jungle / AUREUS)
- HeyGen avatar-walkthrough tooling (assets rendered out-of-repo)
- 11 themed design systems (token-driven)
- Real 3D flagships (WebXR)
- fal.ai hero image generation pipeline
- Remotion video pipeline (reels, showreels)
- Scroll capture tooling (Playwright → MP4)
- cinematic-doctor scoring
- npx installer + ClawHub listing

### Latest: HeyGen walkthrough integration (NEW)

Added `tools/heygen/` — a pipeline that turns any finished scroll site into an
avatar-narrated walkthrough video via HeyGen:

1. `capture-walkthrough-frames.mjs` — Playwright extracts key scroll positions as 1920×1080 PNGs
2. `generate-walkthrough.mjs` — orchestrates capture + optional fal.ai sticker generation + narration script + HeyGen payload
3. Uses the HeyGen MCP (Video Agent or direct avatar API) to produce the final video

**Sticker layer**: fal.ai `birefnet/v2` removes backgrounds from scroll frames → transparent PNGs that can be:
- Overlaid in HeyGen videos as floating product shots
- Used as depth-layer elements in the scroll sites themselves
- Combined with HeyGen's transparent-background avatar for full compositing

## Architecture: the three-layer promo stack

```
Layer 1: The Scroll Site (cinematic-scroll skill)
  └── Token-driven, any aesthetic, auto-scored

Layer 2: The Launch Film (Remotion + scroll capture)
  └── Site footage → data-driven compositions → MP4 reels

Layer 3: The Avatar Walkthrough (HeyGen + fal.ai stickers)
  └── Site frames → bg removal → avatar narration → video
```

Each layer feeds the next. A single site build propagates into all three outputs.

### Latest: three scroll-driven camera fly-throughs (procedural Three.js)

Built to answer "websites where video/animation speed is tied to scrolling +
floating appearing text" (refs: ICG-gallery laptop clip + AI-Studio jungle).
All three use scroll = camera pace through a real-time 3D space, one renderer,
no video, with floating kinetic text beats. Doctor 94 each, page-proof clean.

- examples/gallery-flythrough/ (A — ATELIER·MARNE): warm architectural gallery,
  CatmullRom camera dolly through halls; ceiling light strips, framed art,
  spotlit brass sculptures on plinths, archway threshold; follow-lights.
- examples/jungle-flythrough/ (B — VERDANT): overgrown concrete colonnade,
  InstancedMesh foliage (3 green tones + vines), FogExp2, additive god-ray
  shafts; frosted glass cards ("We transform sterile concrete…") + Anton
  "FULL POWER" grunge finale.
- examples/aureus-flythrough/ (C — AUREUS "Into the vault"): the fintech chrome
  world as a forward flight — raymarched liquid-metal blobs domain-repeated in
  z so the corridor is endless; scroll drives uFly forward; scrubbed count-ups.

Shared pattern: fixed canvas, scroll→camera progress (rAF-throttled), word-mask
kinetic beats via IntersectionObserver, WebGL guard + CSS fallback, context-loss
handling, visibility-gated rAF, capped DPR, reduced-motion single-frame.

### Earlier: AUREUS rebuilt with real scroll-immersive choreography

The digital-wealth example was rebuilt from "fade-in on enter" to true
scroll-driven immersion (a2755c9):

- Hero pins 300vh with multi-depth parallax exit (each layer lifts at
  a different speed — eyebrow 1.0x, title 0.8x, subtitle 0.6x, buttons 0.4x)
- Statement pins 200vh with scale 0.65→1.0→1.08 then exit
- Each chapter pins 250vh — copy scrubs in from left/right, visual enters
  from opposite side with 3D rotateY, holds for reading, then both exit
- Sparkline draws via stroke-dashoffset scrubbed to scroll
- APY + stats count proportionally to scroll position (not trigger-once)
- Allocation bars grow with scroll
- 6 floating ambient geometry elements parallax at 0.15x–0.55x
- WebGL camera orbits more dramatically with full-page scroll progress

cinematic-doctor 94/100, page-proof clean, shots verified.

### Shipped: first composite walkthrough (2026-06-23)

Produced the first real avatar walkthrough end-to-end:
- `assets/heygen-walkthrough/cinematic-scroll-walkthrough-composite-16x9.mp4` (41s, 1080p, no watermark)
- Digital twin "Simone Leonelli" narrating in a clean corner card over real scroll footage
  (clinical-noir → liquid-chrome → warm-scrapbook → data-cinematic)
- See `assets/heygen-walkthrough/README.md` for the exact ffmpeg recipe

**Learnings:**
- HeyGen **Video Agent** path watermarks free-plan output + ignores site footage → use
  **direct `create_video_from_avatar`** instead (no watermark, predictable framing).
- The twin lacks matting → no transparent/webm avatar. Composite uses a rectangular PiP
  card. For a true cut-out, retrain the avatar with matting enabled.

## Next steps

- [ ] Codify the composite into a reusable `tools/heygen/composite-walkthrough.mjs`
- [ ] Retrain avatar with matting → transparent floating cut-out over the site
- [ ] Test the walkthrough pipeline end-to-end on an example site
- [ ] Create a sample narration script template per aesthetic archetype
- [ ] Add fal.ai sticker generation as a first-class Mode B pipeline step
- [ ] Document the HeyGen Video Agent → Remotion composition workflow (avatar + site footage in one edit)
- [ ] Add 9:16 vertical variant for TikTok/Reels
- [ ] Draft asset-direction module spec (visual world + motifs before code)
