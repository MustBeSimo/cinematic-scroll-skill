import { fal } from '@fal-ai/client';
import { buildEditionPrompt, EDITION_AVOID, type EditionAssetPrompt } from './prompt-contract';
import { getModel, resolveModelId, type FalImageModelId, type Orientation } from './fal-models';

export type GeneratedEditionAsset = {
  chapterId: string;
  url: string;
  modelId: FalImageModelId;
  requestId?: string;
  raw: unknown;
};

const ORIENTATION_FOR: Record<EditionAssetPrompt['outputRole'], Orientation> = {
  hero: 'landscape',
  'chapter-bg': 'landscape',
  'foreground-object': 'portrait',
  poster: 'portrait',
  'motion-source': 'landscape',
};

/**
 * Synchronous generation — best for prototyping and asset-script batches up to ~5 chapters.
 * For long-running batches or video models, use `submitEditionImage()` (queue + webhook).
 */
export async function generateEditionImage(
  input: EditionAssetPrompt,
  overrideModelId?: FalImageModelId,
): Promise<GeneratedEditionAsset> {
  const modelId = overrideModelId ?? resolveModelId(process.env.FAL_IMAGE_MODEL);
  const model = getModel(modelId);

  const modelInput = model.buildInput({
    prompt: buildEditionPrompt(input),
    avoid: EDITION_AVOID,
    orientation: ORIENTATION_FOR[input.outputRole],
    seed: input.seed,
  });

  // THIRD-PARTY DATA TRANSMISSION: this sends `modelInput` — which includes the
  // built prompt derived from the user's brief — to the fal.ai remote API over the
  // network, authenticated with the server-side FAL_KEY. Prompts and the resulting
  // image URLs leave your infrastructure and are processed/billed by fal.ai. This
  // runs only on a user-initiated Mode B generation. Disclosed in manifest.json →
  // security and SKILL.md; do not pass secrets or PII in the brief.
  const result = await fal.subscribe(modelId, {
    input: modelInput,
    logs: true,
  });

  const url = model.extractUrl(result.data);
  if (!url) {
    throw new Error(`fal.ai (${modelId}) returned no image URL. Raw: ${JSON.stringify(result.data).slice(0, 200)}`);
  }

  return {
    chapterId: input.chapterId,
    url,
    modelId,
    requestId: result.requestId,
    raw: result.data,
  };
}

/**
 * Async submission — returns a request_id immediately, fal posts the result to
 * `webhookUrl` when complete. Use this in production for batch generation, video
 * models, or any chapter set above 5 images.
 *
 * The webhook receiver lives at `app/api/fal/webhook/route.ts`.
 */
export async function submitEditionImage(
  input: EditionAssetPrompt,
  webhookUrl: string,
  overrideModelId?: FalImageModelId,
): Promise<{ requestId: string; modelId: FalImageModelId }> {
  const modelId = overrideModelId ?? resolveModelId(process.env.FAL_IMAGE_MODEL);
  const model = getModel(modelId);

  const modelInput = model.buildInput({
    prompt: buildEditionPrompt(input),
    avoid: EDITION_AVOID,
    orientation: ORIENTATION_FOR[input.outputRole],
    seed: input.seed,
  });

  const { request_id } = await fal.queue.submit(modelId, {
    input: modelInput,
    webhookUrl,
  });

  return { requestId: request_id, modelId };
}
