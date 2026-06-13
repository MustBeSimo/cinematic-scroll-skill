'use client';

/**
 * AR quick-look — `<model-viewer>` (`references/webxr.md` §4).
 *
 * The pragmatic AR path for phones: skips WebXR entirely and hands off to ARKit
 * Quick Look (iOS, via `ios-src` USDZ) or Scene Viewer (Android, via the GLB).
 * The component self-registers on import; we lazy-load it client-side so it
 * never runs on the server and only ships when an AR chapter is actually used.
 *
 * Falls back gracefully: with no model/usdz it shows the poster only, and the
 * AR CTA is hidden when `canActivateAR` is false (no dead buttons).
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Minimal typed surface of the `<model-viewer>` element we touch. */
type ModelViewerElement = HTMLElement & {
  canActivateAR?: boolean;
};

/** Typed JSX for the custom element — only the attributes we set. */
type ModelViewerAttributes = {
  src?: string;
  'ios-src'?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: string;
  'camera-controls'?: boolean;
  'shadow-intensity'?: string;
  'environment-image'?: string;
  poster?: string;
  reveal?: string;
  alt?: string;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
  ref?: React.Ref<ModelViewerElement>;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}

const MODEL_VIEWER_VERSION = '3.5.0'; // pinned — `references/3d-stack.md` §2

export type ModelViewerProps = {
  /** `.glb` for the web preview + Android Scene Viewer. */
  src: string;
  /** `.usdz` for iOS Quick Look (required for iOS AR). */
  iosSrc?: string | null;
  /** Static fallback shown before load and when WebGL/AR is unavailable. */
  poster: string;
  alt: string;
  ctaLabel?: string;
};

export function ModelViewer({ src, iosSrc, poster, alt, ctaLabel = 'View in your space' }: ModelViewerProps) {
  const ref = useRef<ModelViewerElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Lazy-register the web component on the client only (it self-registers).
  // THIRD-PARTY NETWORK CALL: this fetches and executes the @google/model-viewer
  // module from the unpkg.com CDN at runtime (version-pinned). It runs only when an
  // AR/quick-look view is rendered. If your CSP / deployment policy forbids third-party
  // CDNs, self-host model-viewer and point `url` at your own origin (and add an SRI
  // hash to the script element below). Disclosed in manifest.json → security.
  useEffect(() => {
    let cancelled = false;
    const url = `https://unpkg.com/@google/model-viewer@${MODEL_VIEWER_VERSION}/dist/model-viewer.min.js`;
    if (customElements.get('model-viewer')) {
      setLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[data-model-viewer="${MODEL_VIEWER_VERSION}"]`);
    if (existing) {
      existing.addEventListener('load', () => !cancelled && setLoaded(true), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.dataset.modelViewer = MODEL_VIEWER_VERSION;
    script.addEventListener('load', () => !cancelled && setLoaded(true), { once: true });
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the AR CTA when the device can't actually launch AR (no dead button).
  useEffect(() => {
    const el = ref.current;
    if (!el || !loaded) return;
    const onLoad = () => {
      if (!el.canActivateAR) el.querySelector('.ar-cta')?.setAttribute('hidden', '');
    };
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [loaded]);

  return (
    <model-viewer
      ref={ref}
      src={src}
      ios-src={iosSrc ?? undefined}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-scale="fixed"
      camera-controls
      shadow-intensity="1"
      environment-image="neutral"
      poster={poster}
      reveal="auto"
      alt={alt}
      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
    >
      <button slot="ar-button" className="ar-cta">
        {ctaLabel}
      </button>
    </model-viewer>
  );
}
