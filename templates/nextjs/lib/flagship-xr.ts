'use client';

/**
 * Shared WebXR store for the flagship (Mode B) — `@react-three/xr` v6.
 *
 * Lives in its own module so both the Canvas (`FlagshipScene`) and the HTML
 * overlay (`FlagshipOverlay`) can reach it without a circular import. The v6
 * shape is `createXRStore()` + `<XR store={...}>` + entry via `store.enterVR()`
 * / `store.enterAR()` (`references/webxr.md` §3) — NOT the v5 `<VRButton>`.
 */

import { useEffect, useState } from 'react';
import { createXRStore } from '@react-three/xr';

/** One store per experience (module scope). */
export const flagshipXRStore = createXRStore();

export type EnterXR = {
  /** True while an immersive session is presenting. */
  presenting: boolean;
  enterVR: () => void;
  enterAR: () => void;
  /** End the current session — the always-reachable exit (`webxr.md` §5). */
  exit: () => void;
};

/**
 * Hook for the overlay's Enter-XR affordances. Subscribes to session presence so
 * the UI can surface an Exit control while presenting. Entry methods swallow
 * rejection (user dismissed the permission prompt) and leave the 2D page running.
 */
export function useEnterXR(): EnterXR {
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    const unsub = flagshipXRStore.subscribe((s) => setPresenting(s.session != null));
    return unsub;
  }, []);

  return {
    presenting,
    enterVR: () => {
      flagshipXRStore.enterVR().catch(() => undefined);
    },
    enterAR: () => {
      flagshipXRStore.enterAR().catch(() => undefined);
    },
    exit: () => {
      flagshipXRStore.getState().session?.end().catch(() => undefined);
    },
  };
}
