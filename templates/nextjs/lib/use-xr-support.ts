'use client';

import { useEffect, useState } from 'react';

/**
 * WebXR session support, resolved once on mount. `references/webxr.md` §1:
 * detect BEFORE offering any Enter-XR button — a dead button is a broken
 * promise. `navigator.xr` may be absent, present-but-unsupported, or supported;
 * `isSessionSupported()` is async and can reject on some UAs, so each probe is
 * wrapped to never throw.
 *
 * SSR-safe: starts `{ vr: false, ar: false }` and only flips after the
 * client-side probe resolves, so the server render never shows a button.
 */
export type XRSupport = {
  /** `immersive-vr` available (a headset is connected/usable). */
  vr: boolean;
  /** `immersive-ar` available (AR-capable phone or passthrough headset). */
  ar: boolean;
  /** True once the async probe has resolved (avoids button flash). */
  ready: boolean;
};

export function useXRSupport(): XRSupport {
  const [support, setSupport] = useState<XRSupport>({ vr: false, ar: false, ready: false });

  useEffect(() => {
    let cancelled = false;

    async function probe(): Promise<{ vr: boolean; ar: boolean }> {
      const xr = typeof navigator !== 'undefined' ? navigator.xr : undefined;
      if (!xr) return { vr: false, ar: false };
      const safe = (mode: XRSessionMode) =>
        xr.isSessionSupported(mode).catch(() => false); // can throw on some UAs
      const [vr, ar] = await Promise.all([safe('immersive-vr'), safe('immersive-ar')]);
      return { vr, ar };
    }

    probe().then(({ vr, ar }) => {
      if (!cancelled) setSupport({ vr, ar, ready: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return support;
}
