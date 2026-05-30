import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * fal.ai webhook receiver — called when a queued generation completes.
 *
 * Payload shape (from https://fal.ai/docs/documentation/model-apis/inference/webhooks):
 *   {
 *     request_id: string,
 *     gateway_request_id: string,
 *     status: 'OK' | 'ERROR',
 *     payload: { images: [{ url, content_type, file_name, file_size, width, height }], seed },
 *     error?: string
 *   }
 *
 * Production checklist:
 *   1. Verify the `X-Fal-Webhook-Signature` header against your webhook secret
 *      (configure in the fal.ai dashboard → Webhooks).
 *   2. Persist {request_id → asset_url} in your DB / KV so the client can poll
 *      or subscribe via SSE / Pusher / Ably.
 *   3. Always return 200 quickly — fal retries non-2xx responses.
 */
export async function POST(req: NextRequest) {
  let body: {
    request_id?: string;
    gateway_request_id?: string;
    status?: 'OK' | 'ERROR';
    payload?: { images?: Array<{ url?: string }>; seed?: number };
    error?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const chapterId = req.nextUrl.searchParams.get('chapter') ?? 'unknown';
  const imageUrl = body.payload?.images?.[0]?.url;

  // TODO(you): persist this to your storage layer.
  // Example with @vercel/kv:
  //   await kv.set(`asset:${chapterId}`, { url: imageUrl, requestId: body.request_id });
  console.log('[fal-webhook]', {
    chapterId,
    requestId: body.request_id,
    status: body.status,
    url: imageUrl,
    error: body.error,
  });

  return NextResponse.json({ received: true });
}
