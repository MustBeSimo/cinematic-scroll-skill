# The Demo Video — your single highest-leverage asset

Build this **before** you launch anything. It's the hook tweet, the PH gallery thumbnail,
the README top, the landing hero, the Reddit post. One asset, every surface.

**The core idea:** show the *magic moment* — a human types one sentence, a stunning site
scrolls into existence. Your five live examples prove the *output*; this proves the *skill
doing the work*. That transformation is what gets shared.

---

## Two cuts from one recording

| Cut | Length | Use | Audio |
|---|---|---|---|
| **The Loop** | 12–18s | X hook, PH thumbnail, README top, landing hero | Silent + captions (autoplays muted in feeds) |
| **The Walkthrough** | 40–60s | YouTube, PH gallery #1, "how it works" replies | Optional VO or captions |

Record once at high quality, then cut both.

---

## Storyboard — The Loop (the money shot)

| t | Shot | On-screen caption |
|---|---|---|
| 0.0–2.5s | The prompt being typed into Claude/Cursor: *"a cinematic scroll page for a sci-fi game — teal fog, crimson edge-light, 4 chapters."* Cursor blinks, hits enter. | `one sentence →` |
| 2.5–4.0s | Hard cut. Code/build flashes by fast (speed-ramped 8–10x). | `Claude art-directs it` |
| 4.0–14s | The finished **noir** site scrolling: title mask-wipe, parallax layers separating, the 3D camera tilt, background morphing between chapters. Smooth, unhurried scroll. | (let it breathe — no caption) |
| 14–16s | Snap-cut montage: same scroll beat in **luxe → pop → renaissance** (0.6s each). | `same engine. any look.` |
| 16–18s | End card: "Cinematic Scroll · free & MIT" + `npx cinematic-scroll-skill` + the URL. | — |

The first 2.5 seconds decide everything. Show the *typing* — proof a human did almost nothing.

## Storyboard — The Walkthrough (40–60s)
1. (0–4s) Same prompt hook.
2. (4–10s) "It runs Claude through a 5-phase pipeline" — quick overlay of the phase names.
3. (10–35s) The noir site scrolled top-to-bottom at a real, satisfying pace — linger on the best 3 beats (title reveal, parallax separation, chapter morph).
4. (35–50s) The five-worlds montage, ~2s each, labeled.
5. (50–60s) Mode A vs Mode B one-liner + install command + end card.

---

## Recording setup (do this once, properly)

- **Browser:** clean Chrome, no extensions bar, no bookmarks, hidden. Incognito + full-screen.
- **Window size:** record at **1512×982** (or 1440×900) on a Retina display → exports crisp at 1080p+. For the vertical X/Reddit variant, also frame a 9:16 crop of the scroll.
- **Cursor:** enlarge it / use a highlight so the typing reads. Slow your keystrokes deliberately.
- **Scroll:** use a trackpad with smooth scroll, or script an auto-scroll so it's even (jerky scroll kills the cinematic feel). Lenis on the Mode B site already smooths it.
- **Frame rate:** capture at 60fps if you can — scroll motion benefits hugely.
- **Tool:** macOS `Cmd+Shift+5` (built-in), or Screen Studio / CleanShot X for auto-zoom + smooth cursor (worth it for this one asset).
- Use the **noir** world as the hero — it's the most obviously "expensive"-looking and matches the social card.

---

## Post-production with ffmpeg (paste-ready)

Assuming your raw capture is `raw.mov`. Run in the repo's `assets/` folder.

**1) Trim + speed-ramp the build section** (example: keep 0–3s real-time, then a fast chunk):
```bash
# fast-forward the "building" middle 8s to ~1s (10x), keep audio off
ffmpeg -i raw.mov -filter:v "setpts=0.1*PTS" -an build_fast.mp4
```

**2) Export the web-optimized MP4 (H.264, faststart, ~1080p):**
```bash
ffmpeg -i loop_edit.mov \
  -vf "scale=1280:-2:flags=lanczos" \
  -c:v libx264 -profile:v high -crf 23 -preset slow \
  -pix_fmt yuv420p -movflags +faststart -an \
  assets/demo-loop.mp4
```
> `-pix_fmt yuv420p` is mandatory or Twitter/Safari won't play it. `+faststart` lets it stream before fully downloaded. `-an` strips audio for the silent loop.

**3) Export a WebM (smaller, for the landing `<video>`):**
```bash
ffmpeg -i loop_edit.mov -vf "scale=1280:-2:flags=lanczos" \
  -c:v libvpx-vp9 -crf 32 -b:v 0 -an assets/demo-loop.webm
```

**4) Poster frame (shown before the video loads):**
```bash
ffmpeg -i assets/demo-loop.mp4 -vf "select=eq(n\,0)" -frames:v 1 assets/demo-poster.jpg
```

**5) A lightweight GIF fallback** (only if you need it; keep ≤5MB):
```bash
ffmpeg -i assets/demo-loop.mp4 -vf "fps=15,scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" assets/demo-loop.gif
```

Target sizes: MP4 ≤ 5MB for the loop, WebM ≤ 3MB. If bigger, drop to 720p (`scale=1280` → `960`) or raise CRF.

---

## Where each file goes

- **Landing hero** (`index.html`): replace/augment the static hero `<img>` with an autoplaying muted loop:
  ```html
  <video autoplay loop muted playsinline poster="./assets/demo-poster.jpg"
         class="dk" style="width:100%;border-radius:12px">
    <source src="./assets/demo-loop.webm" type="video/webm">
    <source src="./assets/demo-loop.mp4" type="video/mp4">
  </video>
  ```
- **README top:** GitHub renders uploaded video inline. Easiest path: open the README in the github.com editor, **drag `demo-loop.mp4` into the text box** → GitHub hosts it and inserts a player URL. (Committing the mp4 and linking it works too, but the drag-drop player looks best.)
- **X / LinkedIn / Reddit:** upload `demo-loop.mp4` natively (never a YouTube link in the hook — native video gets ~5–10x the reach).
- **Product Hunt gallery:** `demo-loop.mp4` as asset #1.

---

## If you can't screen-record right now
Ship an **animated montage** as a stopgap: stitch the five existing world GIFs into one labeled 16s MP4 with the same end card. It's weaker than prompt→site (no "magic moment") but still beats a static image on every channel. Replace it with the real thing within the week — the prompt→site version is worth re-recording for.
