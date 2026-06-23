#!/usr/bin/env node
/**
 * generate-walkthrough.mjs — full pipeline: capture scroll frames → optionally
 * create fal.ai stickers (background-removed cutouts) → generate HeyGen
 * walkthrough video payload.
 *
 * This script orchestrates the capture and produces a ready-to-fire HeyGen
 * video request. Use it with the HeyGen MCP tools or the HeyGen API directly.
 *
 *   node tools/heygen/generate-walkthrough.mjs <page-path-or-url> [options]
 *
 * Options:
 *   --avatar-id <id>      HeyGen avatar look_id (required for direct API call)
 *   --voice-id <id>       HeyGen voice_id (optional, uses avatar default)
 *   --script <text|file>  Narration script (or path to .txt). Auto-generated if omitted.
 *   --stickers            Also generate fal.ai background-removed PNGs from frames
 *   --sticker-frames 0,2  Comma-separated frame indices to create stickers from (default: 1,3)
 *   --count <N>           Number of scroll frames to capture (default: 5)
 *   --out <dir>           Output directory (default: .heygen/<slug>)
 *   --aspect <ratio>      Video aspect ratio: 16:9 | 9:16 | 1:1 (default: 16:9)
 *   --dry-run             Print the payload without calling any API
 *
 * Env vars:
 *   FAL_KEY               Required for --stickers (fal.ai background removal)
 *   HEYGEN_API_KEY        Optional: if set, submits the video directly
 *
 * Output:
 *   .heygen/<slug>/frames/        captured PNGs
 *   .heygen/<slug>/stickers/      background-removed PNGs (if --stickers)
 *   .heygen/<slug>/payload.json   ready-to-fire HeyGen request
 *   .heygen/<slug>/script.txt     generated narration script
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function parseArgs(argv) {
  const a = argv.slice(2);
  const opts = {
    target: null,
    avatarId: null,
    voiceId: null,
    script: null,
    stickers: false,
    stickerFrames: [1, 3],
    count: 5,
    out: null,
    aspect: "16:9",
    dryRun: false,
  };

  const positional = [];
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--avatar-id":
        opts.avatarId = a[++i];
        break;
      case "--voice-id":
        opts.voiceId = a[++i];
        break;
      case "--script":
        opts.script = a[++i];
        break;
      case "--stickers":
        opts.stickers = true;
        break;
      case "--sticker-frames":
        opts.stickerFrames = a[++i].split(",").map(Number);
        break;
      case "--count":
        opts.count = Number(a[++i]);
        break;
      case "--out":
        opts.out = a[++i];
        break;
      case "--aspect":
        opts.aspect = a[++i];
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      default:
        positional.push(a[i]);
    }
  }
  opts.target = positional[0];
  return opts;
}

const opts = parseArgs(process.argv);
if (!opts.target) {
  console.error("usage: generate-walkthrough.mjs <page-path-or-url> [options]");
  console.error("  run with --help for all options");
  process.exit(2);
}

const isUrl =
  opts.target.startsWith("http://") || opts.target.startsWith("https://");
const slug = isUrl
  ? new URL(opts.target).hostname.replace(/\./g, "-")
  : path.basename(path.dirname(opts.target)) ||
    path.basename(opts.target, ".html");

const baseDir = path.resolve(ROOT, opts.out || `.heygen/${slug}`);
const framesDir = path.join(baseDir, "frames");
const stickersDir = path.join(baseDir, "stickers");
fs.mkdirSync(baseDir, { recursive: true });

// ─── Step 1: Capture scroll frames ──────────────────────────────────────────
console.log(`\n● Step 1: Capturing ${opts.count} scroll frames from ${opts.target}…`);
execFileSync(
  process.execPath,
  [
    path.join(ROOT, "tools/heygen/capture-walkthrough-frames.mjs"),
    opts.target,
    "--out",
    framesDir,
    "--count",
    String(opts.count),
  ],
  { stdio: "inherit", cwd: ROOT }
);

const manifest = JSON.parse(
  fs.readFileSync(path.join(framesDir, "manifest.json"), "utf8")
);

// ─── Step 2: fal.ai sticker generation (optional) ───────────────────────────
let stickerPaths = [];
if (opts.stickers) {
  console.log(`\n● Step 2: Generating stickers (bg removal) via fal.ai…`);

  let FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    const envPath = path.join(ROOT, ".env.local");
    if (fs.existsSync(envPath)) {
      const m = fs
        .readFileSync(envPath, "utf8")
        .match(/^\s*FAL_KEY\s*=\s*(.+?)\s*$/m);
      if (m) FAL_KEY = m[1].replace(/^["']|["']$/g, "");
    }
  }
  if (!FAL_KEY) {
    console.error("  ✗ FAL_KEY missing — skipping sticker generation");
  } else {
    fs.mkdirSync(stickersDir, { recursive: true });
    const MODEL = "fal-ai/birefnet/v2";

    for (const idx of opts.stickerFrames) {
      const frame = manifest.frames[idx];
      if (!frame) {
        console.log(`  skip: frame index ${idx} out of range`);
        continue;
      }

      process.stdout.write(`  removing bg from frame ${idx}… `);
      try {
        const imgBuf = fs.readFileSync(frame.path);
        const base64 = imgBuf.toString("base64");
        const dataUri = `data:image/png;base64,${base64}`;

        const resp = await fetch(`https://fal.run/${MODEL}`, {
          method: "POST",
          headers: {
            Authorization: `Key ${FAL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: dataUri,
            model: "General Use (Light)",
            output_format: "png",
          }),
        });

        if (!resp.ok)
          throw new Error(
            `HTTP ${resp.status} ${(await resp.text()).slice(0, 160)}`
          );
        const data = await resp.json();
        const imgUrl = data?.image?.url;
        if (!imgUrl) throw new Error("no image url in response");

        const stickerBuf = Buffer.from(
          await (await fetch(imgUrl)).arrayBuffer()
        );
        const stickerPath = path.join(
          stickersDir,
          `${slug}-sticker-${String(idx).padStart(2, "0")}.png`
        );
        fs.writeFileSync(stickerPath, stickerBuf);
        stickerPaths.push({ index: idx, path: stickerPath });
        console.log(`✓ ${(stickerBuf.length / 1024).toFixed(0)}KB`);
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
    }
  }
} else {
  console.log(`\n● Step 2: Skipped sticker generation (use --stickers to enable)`);
}

// ─── Step 3: Narration script ────────────────────────────────────────────────
console.log(`\n● Step 3: Preparing narration script…`);

let scriptText = "";
if (opts.script) {
  if (fs.existsSync(opts.script)) {
    scriptText = fs.readFileSync(opts.script, "utf8").trim();
  } else {
    scriptText = opts.script;
  }
} else {
  scriptText = generateDefaultScript(slug, manifest.frameCount);
}

const scriptPath = path.join(baseDir, "script.txt");
fs.writeFileSync(scriptPath, scriptText);
console.log(`  script → ${scriptPath}`);

// ─── Step 4: Assemble HeyGen payload ────────────────────────────────────────
console.log(`\n● Step 4: Assembling HeyGen payload…`);

const payload = {
  _meta: {
    tool: "generate-walkthrough",
    slug,
    source: opts.target,
    generatedAt: new Date().toISOString(),
  },
  videoAgent: {
    prompt: buildVideoAgentPrompt(slug, scriptText, manifest),
    orientation: opts.aspect === "9:16" ? "portrait" : "landscape",
    ...(opts.avatarId && { avatarId: opts.avatarId }),
  },
  directApi: {
    avatarId: opts.avatarId || "<your-avatar-look-id>",
    script: scriptText,
    ...(opts.voiceId && { voiceId: opts.voiceId }),
    aspectRatio: opts.aspect,
    resolution: "1080p",
    background: {
      type: "image",
      note: "Use frame PNGs as background per scene segment",
    },
  },
  assets: {
    frames: manifest.frames.map((f) => f.path),
    stickers: stickerPaths.map((s) => s.path),
  },
};

const payloadPath = path.join(baseDir, "payload.json");
fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
console.log(`  payload → ${payloadPath}`);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`
✓ Walkthrough package ready: ${baseDir}
  ${manifest.frameCount} frames captured
  ${stickerPaths.length} stickers generated
  Script: ${scriptPath}
  Payload: ${payloadPath}

Next steps:
  1. Use HeyGen MCP "create_video_agent" with the prompt in payload.json → videoAgent
  2. Or use "create_video_from_avatar" with frames as background images → directApi
  3. Upload frames via "create_asset_upload" first for background use
`);

if (opts.dryRun) {
  console.log("─── Payload (dry run) ───");
  console.log(JSON.stringify(payload, null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateDefaultScript(name, count) {
  const intro = `Welcome to ${name}. Let me walk you through this cinematic scroll experience.`;
  const middle = `As you scroll, each section reveals itself with depth and motion — pinned chapters, parallax layers, and environment-morphing transitions that transform the page into a living story.`;
  const detail = `Every element is choreographed: the hero holds your attention, then releases into the narrative flow. Backgrounds shift, figures float at different speeds, and the pacing breathes — fast where it excites, slow where it resonates.`;
  const close = `This is what scroll-driven storytelling looks like when taste meets engineering. One engine, any aesthetic — built by cinematic-scroll.`;
  return [intro, middle, detail, close].join("\n\n");
}

function buildVideoAgentPrompt(name, script, manifest) {
  return `Create a professional walkthrough video presenting a cinematic scroll website called "${name}".

The video should show an avatar presenter narrating over screenshots of the website at different scroll positions. The tone is confident, editorial — like a design director presenting their latest work.

Narration script:
${script}

Technical details:
- ${manifest.frameCount} key scroll positions captured (0% to 100% of page)
- Resolution: ${manifest.resolution}
- The site features scroll-driven animations, pinned chapters, and parallax depth

Style: Clean, minimal presentation. The website screenshots should dominate the frame with the avatar in a smaller overlay or picture-in-picture format. Pacing should be smooth and cinematic — matching the scroll experience itself.`;
}
