#!/usr/bin/env node
/**
 * Flagship 3D asset generator — fal.ai, two stages per chapter:
 *
 *   1. IMAGE   text → concept image (default fal-ai/nano-banana-2, synchronous;
 *              --image-model for flux/gemini). Single centered subject on a
 *              plain dark ground — the framing image-to-3D models reconstruct best.
 *   2. MESH    image → 3D GLB (default fal-ai/trellis, via fal's QUEUE API —
 *              mesh jobs run minutes, so we submit + poll, never block on
 *              a single HTTP call).
 *
 * Outputs per chapter (object · world · figure — field is procedural by design):
 *   public/flagship/<id>/<id>.glb        the mesh (what the manifest points at)
 *   public/flagship/<id>/concept.jpg     the concept image (reference / poster)
 *
 * Usage:
 *   node scripts/generate-flagship-assets.mjs --dry-run        # print plan only
 *   node scripts/generate-flagship-assets.mjs                  # all three chapters
 *   node scripts/generate-flagship-assets.mjs --only object
 *   node scripts/generate-flagship-assets.mjs --apply          # also patch the manifest
 *   node scripts/generate-flagship-assets.mjs --mesh-model fal-ai/hunyuan3d/v2
 *
 * Requires FAL_KEY in .env.local or the shell (same as generate-chapter-assets).
 *
 * Notes:
 *   • Generated meshes are UNRIGGED. The Figure chapter loads one as a still
 *     sculpture; for a breathing/gesturing avatar, rig via Mixamo instead
 *     (see ASSETS-3D.md §4).
 *   • Loaded models are auto-normalized at runtime (lib/normalize-model.ts),
 *     so arbitrary generated scales/offsets are safe.
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv, env, exit } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─── art direction per chapter (single subject, dark ground, no text) ──────

const SHARED =
  'Single object, perfectly centered, floating on a plain near-black studio background, ' +
  'soft even lighting, full subject visible with margin on all sides, crisp silhouette, ' +
  'physically based materials. No text, no logos, no watermark, no humans in frame.';

const CHAPTERS = [
  {
    id: 'object',
    prompt:
      'A sculptural luxury chronometer artifact: faceted sapphire-glass core inside a ' +
      'brushed-titanium exoskeleton with brass detailing, museum piece, premium product ' +
      'photography. ' + SHARED,
  },
  {
    id: 'world',
    prompt:
      'A miniature architectural diorama of a monumental colonnaded hall: two rows of ' +
      'dark stone columns with brass inlay, coffered ceiling beams, cyan light strips ' +
      'recessed along the floor edges, moody cinematic scale model. ' + SHARED,
  },
  {
    id: 'figure',
    prompt:
      'A full-body stylized android figure standing upright in a neutral A-pose: matte ' +
      'white ceramic shell over brushed-titanium joints, single glowing cyan visor band ' +
      'across the face, elegant sci-fi sculpture, feet together on the ground. ' + SHARED,
  },
];

// ─── args / env (same conventions as generate-chapter-assets.mjs) ──────────

const args = argv.slice(2);
const readFlag = (name) => {
  const eq = args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
  if (eq) return eq;
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};

const flags = {
  dryRun: args.includes('--dry-run'),
  apply: args.includes('--apply'),
  // Web meshes must be light: Draco geometry + WebP textures (loads with zero
  // code change — drei's useGLTF defaults Draco on, WebP decodes natively).
  // On by default; --no-optimize keeps the raw generator output.
  optimize: !args.includes('--no-optimize'),
  only: (readFlag('only') ?? '').split(',').filter(Boolean),
  imageModel: readFlag('image-model'),
  meshModel: readFlag('mesh-model'),
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

try {
  const envText = await readFile(resolve(projectRoot, '.env.local'), 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
} catch {
  // .env.local optional
}

const FAL_KEY = env.FAL_KEY;
const IMAGE_MODEL = flags.imageModel ?? env.FAL_IMAGE_MODEL ?? 'fal-ai/nano-banana-2';
const MESH_MODEL = flags.meshModel ?? env.FAL_MESH_MODEL ?? 'fal-ai/trellis';

if (!FAL_KEY && !flags.dryRun) {
  console.error('\n[generate-flagship-assets] FAL_KEY missing. Set it in .env.local or your shell.\n');
  exit(1);
}

const AUTH = { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' };

// ─── stage 1: concept image (synchronous fal.run, like the chapter script) ──

function buildImageInput(modelId, prompt) {
  // nano-banana-* = Google's Gemini image family on fal (reasoning-guided —
  // strong at accurate single-object renders, ideal input for image-to-3D).
  if (modelId.includes('nano-banana') || modelId.startsWith('fal-ai/gemini')) {
    return { prompt, num_images: 1, aspect_ratio: '1:1', resolution: '1K', output_format: 'png' };
  }
  if (modelId.startsWith('fal-ai/flux')) {
    return { prompt, image_size: 'square_hd', output_format: 'jpeg', enable_safety_checker: true, safety_tolerance: '2' };
  }
  return { prompt, aspect_ratio: '1:1', num_images: 1 };
}

async function generateConceptImage(prompt) {
  const resp = await fetch(`https://fal.run/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: AUTH,
    body: JSON.stringify(buildImageInput(IMAGE_MODEL, prompt)),
  });
  if (!resp.ok) throw new Error(`image HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`no image URL in response: ${JSON.stringify(data).slice(0, 200)}`);
  return url;
}

// ─── stage 2: image → 3D via the QUEUE API (mesh jobs run for minutes) ─────

function buildMeshInput(modelId, imageUrl) {
  if (modelId.includes('hunyuan')) return { input_image_url: imageUrl };
  if (modelId.includes('hyper3d') || modelId.includes('rodin')) {
    return { input_image_urls: [imageUrl], geometry_file_format: 'glb' };
  }
  // trellis + sensible default
  return { image_url: imageUrl };
}

/** Walk a response object and return the first URL that looks like a .glb. */
function findGlbUrl(node) {
  if (typeof node === 'string') return /^https?:\/\/.+\.glb(\?|$)/i.test(node) ? node : null;
  if (Array.isArray(node)) {
    for (const v of node) { const hit = findGlbUrl(v); if (hit) return hit; }
    return null;
  }
  if (node && typeof node === 'object') {
    // common shapes first: { model_mesh: { url } }, { model_url }, ...
    for (const key of ['model_mesh', 'model_url', 'mesh', 'model_glb']) {
      if (node[key]) { const hit = findGlbUrl(node[key]); if (hit) return hit; }
    }
    if (typeof node.url === 'string' && /\.glb(\?|$)/i.test(node.url)) return node.url;
    for (const v of Object.values(node)) { const hit = findGlbUrl(v); if (hit) return hit; }
  }
  return null;
}

async function generateMesh(imageUrl, { timeoutMs = 12 * 60 * 1000, pollMs = 4000 } = {}) {
  const submit = await fetch(`https://queue.fal.run/${MESH_MODEL}`, {
    method: 'POST',
    headers: AUTH,
    body: JSON.stringify(buildMeshInput(MESH_MODEL, imageUrl)),
  });
  if (!submit.ok) throw new Error(`mesh submit HTTP ${submit.status}: ${(await submit.text()).slice(0, 300)}`);
  const ticket = await submit.json();
  const statusUrl = ticket.status_url;
  const responseUrl = ticket.response_url;
  if (!statusUrl || !responseUrl) throw new Error(`unexpected queue ticket: ${JSON.stringify(ticket).slice(0, 200)}`);

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (Date.now() > deadline) throw new Error('mesh job timed out');
    await new Promise((r) => setTimeout(r, pollMs));
    const st = await fetch(statusUrl, { headers: AUTH }).then((r) => r.json());
    if (st.status === 'COMPLETED') break;
    if (st.status === 'FAILED' || st.status === 'ERROR') {
      throw new Error(`mesh job failed: ${JSON.stringify(st).slice(0, 300)}`);
    }
    process.stdout.write(`\r  mesh: ${st.status}${st.queue_position != null ? ` (queue ${st.queue_position})` : ''}   `);
  }
  process.stdout.write('\r');

  const result = await fetch(responseUrl, { headers: AUTH }).then((r) => r.json());
  const glbUrl = findGlbUrl(result);
  if (!glbUrl) throw new Error(`no .glb URL in mesh response: ${JSON.stringify(result).slice(0, 300)}`);
  return glbUrl;
}

// ─── compress: in-place Draco geometry + WebP textures (web-ready meshes) ──

async function optimizeGlb(path) {
  const before = (await stat(path)).size;
  try {
    await execFileAsync('npx', [
      '--yes', '@gltf-transform/cli', 'optimize', path, path,
      '--compress', 'draco', '--texture-compress', 'webp',
    ]);
  } catch (err) {
    // Non-fatal: ship the raw mesh, just warn it's heavy.
    console.warn(`  optimize skipped (${err.code === 'ENOENT' ? 'npx not found' : err.message.split('\n')[0]}) — raw mesh kept`);
    return;
  }
  const after = (await stat(path)).size;
  console.log(`  optimized → ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB (Draco + WebP)`);
}

// ─── optional: patch lib/flagship-manifest.ts runtime strings ──────────────

async function applyToManifest(ids) {
  const path = resolve(projectRoot, 'lib/flagship-manifest.ts');
  let src = await readFile(path, 'utf8');
  const anchor = src.indexOf('export const assetManifest');
  if (anchor === -1) throw new Error('assetManifest not found in lib/flagship-manifest.ts');
  let tail = src.slice(anchor);
  for (const id of ids) {
    tail = tail.replace(
      new RegExp(`(${id}:\\s*\\{[\\s\\S]*?runtime:\\s*)'[^']*'`),
      `$1'/flagship/${id}/${id}.glb'`,
    );
  }
  src = src.slice(0, anchor) + tail;
  await writeFile(path, src);
  console.log(`  manifest patched → runtime: '/flagship/<id>/<id>.glb' for: ${ids.join(', ')}`);
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const targets = flags.only.length ? CHAPTERS.filter((c) => flags.only.includes(c.id)) : CHAPTERS;
  if (targets.length === 0) {
    console.error(`no matching chapters (valid: ${CHAPTERS.map((c) => c.id).join(', ')})`);
    exit(2);
  }

  console.log(
    `\n[generate-flagship-assets] image=${IMAGE_MODEL}  mesh=${MESH_MODEL}  chapters=${targets
      .map((c) => c.id)
      .join(',')}  dryRun=${flags.dryRun}\n`,
  );

  const done = [];
  for (const ch of targets) {
    console.log(`─── ${ch.id} ──────────────────────────────`);
    if (flags.dryRun) {
      console.log(`  prompt: ${ch.prompt}\n`);
      continue;
    }
    try {
      const dir = resolve(projectRoot, `public/flagship/${ch.id}`);
      await mkdir(dir, { recursive: true });

      const t0 = Date.now();
      const imageUrl = await generateConceptImage(ch.prompt);
      console.log(`  concept image ok (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      const img = await fetch(imageUrl).then((r) => r.arrayBuffer());
      const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'png';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'png';
      await writeFile(resolve(dir, `concept.${safeExt}`), Buffer.from(img));

      const t1 = Date.now();
      const glbUrl = await generateMesh(imageUrl);
      console.log(`  mesh ok (${((Date.now() - t1) / 1000).toFixed(1)}s)`);
      const glb = await fetch(glbUrl).then((r) => r.arrayBuffer());
      const out = resolve(dir, `${ch.id}.glb`);
      await writeFile(out, Buffer.from(glb));
      console.log(`  saved → public/flagship/${ch.id}/${ch.id}.glb (${(glb.byteLength / 1e6).toFixed(1)} MB)`);
      if (flags.optimize) await optimizeGlb(out);
      done.push(ch.id);
    } catch (err) {
      console.error(`  ERROR  ${err.message}`);
    }
  }

  if (!flags.dryRun && flags.apply && done.length) await applyToManifest(done);

  if (!flags.dryRun && done.length) {
    console.log(`\nDone: ${done.join(', ')}.`);
    if (!flags.apply) {
      console.log(`Point the manifest at the meshes (or re-run with --apply):`);
      for (const id of done) console.log(`  ${id}.runtime → '/flagship/${id}/${id}.glb'`);
    }
    console.log('Models auto-normalize at load (lib/normalize-model.ts) — restart `npm run dev` and open /flagship.\n');
  }
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
