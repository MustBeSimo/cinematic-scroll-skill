# HeyGen Walkthrough Pipeline

Generate avatar-narrated walkthrough videos of cinematic-scroll sites.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Site (local or deployed)                                       │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐     ┌────────────────────────────┐
│ capture-walkthrough-frames   │     │  fal.ai birefnet/v2        │
│ (Playwright screenshots at   │────▶│  background removal        │
│  scroll %, 1920×1080 PNG)    │     │  → sticker PNGs            │
└──────────────┬───────────────┘     └────────────┬───────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  generate-walkthrough.mjs                                        │
│  → frames/ + stickers/ + script.txt + payload.json               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  HeyGen (via MCP or API)                                         │
│  create_video_agent  OR  create_video_from_avatar                │
│  → avatar presents the site with frames as backgrounds           │
└──────────────────────────────────────────────────────────────────┘
```

## Quick start

```bash
# Capture + generate payload (no API calls)
node tools/heygen/generate-walkthrough.mjs examples/noir/index.html --dry-run

# With sticker generation (needs FAL_KEY in .env.local)
node tools/heygen/generate-walkthrough.mjs examples/vanta/index.html --stickers

# Full pipeline: specific avatar + script
node tools/heygen/generate-walkthrough.mjs examples/chroma/index.html \
  --avatar-id "abc123" \
  --voice-id "def456" \
  --script "Welcome to Chroma. Let me show you liquid chrome in motion…" \
  --stickers \
  --aspect 16:9
```

## Tools

### `capture-walkthrough-frames.mjs`

Standalone frame extractor. Captures N evenly-spaced scroll positions as PNGs.

```bash
node tools/heygen/capture-walkthrough-frames.mjs <page> [--out dir] [--count 5]
```

Output: `<out>/manifest.json` + numbered PNGs.

### `generate-walkthrough.mjs`

Full orchestrator. Runs the frame capture, optionally generates stickers via
fal.ai, writes a narration script, and outputs a HeyGen-ready payload.

| Flag | Default | Description |
|---|---|---|
| `--avatar-id` | — | HeyGen avatar look_id |
| `--voice-id` | — | HeyGen voice_id (uses avatar default if omitted) |
| `--script` | auto | Narration text or path to .txt |
| `--stickers` | off | Generate background-removed PNGs via fal.ai |
| `--sticker-frames` | `1,3` | Which frame indices to create stickers from |
| `--count` | `5` | Number of scroll frames |
| `--out` | `.heygen/<slug>` | Output directory |
| `--aspect` | `16:9` | Video aspect ratio |
| `--dry-run` | off | Print payload without API calls |

## Using with HeyGen MCP

After running `generate-walkthrough.mjs`, use the agent's HeyGen MCP tools:

1. **Upload frames** → `create_asset_upload` + PUT + `complete_asset_upload`
2. **Create video** → `create_video_from_avatar` with frame as background image
3. **Or use Video Agent** → `create_video_agent` with the prompt from `payload.json`

The `payload.json` contains two ready-to-use configurations:
- `videoAgent` — for the fire-and-forget Video Agent approach
- `directApi` — for explicit avatar + voice + background control

## The sticker play

When `--stickers` is enabled, the pipeline:
1. Takes specific scroll frames (product shots, hero moments)
2. Sends them to fal.ai `birefnet/v2` for background removal
3. Outputs transparent PNGs — "stickers" — that can be:
   - Layered in the HeyGen video as overlays
   - Used as depth elements in the scroll site itself
   - Combined with HeyGen's `removeBackground: true` avatar for full compositing

**Cost**: ~$0.02 per sticker via fal.ai. A 5-frame walkthrough with 2 stickers = $0.04 total.

## Env vars

| Var | Required for | Notes |
|---|---|---|
| `FAL_KEY` | `--stickers` | fal.ai API key (from .env.local or shell) |
| `CHROME_PATH` | local capture | Falls back to macOS Chrome default |
| `HEYGEN_API_KEY` | direct API mode | Optional — prefer MCP tools instead |

## Output structure

```
.heygen/noir/
├── frames/
│   ├── manifest.json
│   ├── noir-frame-00.png    (hero / 0% scroll)
│   ├── noir-frame-01.png    (25% scroll)
│   ├── noir-frame-02.png    (50% scroll)
│   ├── noir-frame-03.png    (75% scroll)
│   └── noir-frame-04.png    (100% scroll / footer)
├── stickers/
│   ├── noir-sticker-01.png  (bg-removed from frame 1)
│   └── noir-sticker-03.png  (bg-removed from frame 3)
├── script.txt
└── payload.json
```
