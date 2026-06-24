/**
 * heygen-presenter.mjs — generate the talking-head avatar for SkillShowcase and drop it
 * into video/public/showcase/presenter.mp4, then flip the PRESENTER flag so the next
 * `npm run render:showcase` composites the real avatar in the bottom-left PiP.
 *
 *   node scripts/heygen-presenter.mjs --dry-run     # print the script + payload, call nothing
 *   HEYGEN_API_KEY=… node scripts/heygen-presenter.mjs
 *   HEYGEN_API_KEY=… HEYGEN_VOICE_ID=… node scripts/heygen-presenter.mjs
 *
 * Avatar id is fixed to the one you supplied (07ce…). Voice: HEYGEN_VOICE_ID, else the
 * first English voice from HeyGen's /v2/voices. Key is read from env or ../.env.local /
 * the repo-root .env.local. The narration matches the on-card copy in SkillShowcase.tsx.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const VIDEO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(VIDEO, "..");
const AVATAR_ID = "07ce7891efe344c398cd78ad17a5d587";
const dry = process.argv.includes("--dry-run");

const SCRIPT =
  "This is Cinematic Scroll — a free agent skill that turns one sentence into a cinematic, " +
  "scroll-driven website. Describe an aesthetic, and your agent builds it: real WebGL, twelve " +
  "scroll patterns, art-directed to match. These 3D worlds — Verdant, a jungle reclaiming " +
  "concrete, and the Vault, a corridor of liquid chrome — are all live, rendered every frame, " +
  "built by the skill. The motion is the constant; the look is yours. Get it free with npx " +
  "cinematic-scroll-skill.";

async function loadKey() {
  if (process.env.HEYGEN_API_KEY) return process.env.HEYGEN_API_KEY;
  for (const p of [join(REPO, ".env.local"), join(VIDEO, ".env.local")]) {
    if (existsSync(p)) {
      const m = (await readFile(p, "utf8")).match(/^\s*HEYGEN_API_KEY\s*=\s*(.+?)\s*$/m);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

const api = (key) => ({ "X-Api-Key": key, "Content-Type": "application/json" });

async function pickVoice(key) {
  if (process.env.HEYGEN_VOICE_ID) return process.env.HEYGEN_VOICE_ID;
  const r = await fetch("https://api.heygen.com/v2/voices", { headers: api(key) });
  const list = (await r.json())?.data?.voices || [];
  const en = list.find((v) => /en/i.test(v.language || "") && v.voice_id) || list[0];
  if (!en) throw new Error("no voices available — set HEYGEN_VOICE_ID");
  console.log(`voice: ${en.name || en.voice_id} (${en.voice_id})`);
  return en.voice_id;
}

async function main() {
  const out = join(VIDEO, "public/showcase");
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "presenter.script.txt"), SCRIPT);

  const key = await loadKey();
  const payload = {
    video_inputs: [{
      character: { type: "avatar", avatar_id: AVATAR_ID, avatar_style: "normal" },
      voice: { type: "text", input_text: SCRIPT, voice_id: process.env.HEYGEN_VOICE_ID || "<resolved at run>" },
    }],
    dimension: { width: 720, height: 1280 },
  };
  await writeFile(join(out, "presenter.payload.json"), JSON.stringify(payload, null, 2));

  if (dry || !key) {
    console.log("\n— narration —\n" + SCRIPT + "\n");
    console.log("payload → video/public/showcase/presenter.payload.json");
    if (!key) console.log("\n✗ HEYGEN_API_KEY not found. Either set it (env or .env.local) and re-run, or generate\n  the video via the HeyGen MCP/UI with avatar 07ce…, download to\n  video/public/showcase/presenter.mp4, then set PRESENTER.PRESENT=true in\n  src/scenes/showcase/presenter.ts and re-run `npm run render:showcase`.");
    return;
  }

  payload.video_inputs[0].voice.voice_id = await pickVoice(key);
  console.log("● submitting to HeyGen…");
  const sub = await fetch("https://api.heygen.com/v2/video/generate", { method: "POST", headers: api(key), body: JSON.stringify(payload) });
  const subj = await sub.json();
  const id = subj?.data?.video_id;
  if (!id) throw new Error("no video_id: " + JSON.stringify(subj).slice(0, 300));
  console.log("  video_id " + id + " — polling…");

  let url = null;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${id}`, { headers: api(key) }).then((r) => r.json());
    const s = st?.data?.status;
    if (s === "completed") { url = st.data.video_url; break; }
    if (s === "failed") throw new Error("HeyGen failed: " + JSON.stringify(st?.data?.error || st).slice(0, 200));
    process.stdout.write(`  ${s}…\r`);
  }
  if (!url) throw new Error("timed out waiting for HeyGen");

  const bin = await fetch(url).then((r) => r.arrayBuffer());
  await writeFile(join(out, "presenter.mp4"), Buffer.from(bin));
  console.log(`\n✓ presenter.mp4 (${(bin.byteLength / 1e6).toFixed(1)} MB)`);

  // flip the flag so the render composites the real avatar
  const pf = join(VIDEO, "src/scenes/showcase/presenter.ts");
  const txt = (await readFile(pf, "utf8")).replace("PRESENT: false", "PRESENT: true");
  await writeFile(pf, txt);
  console.log("✓ PRESENTER.PRESENT=true — now run: npm run render:showcase");
}

main().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
