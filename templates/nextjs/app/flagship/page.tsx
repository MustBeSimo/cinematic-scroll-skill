import type { Metadata } from 'next';
import { FlagshipRoot } from '@/components/flagship/FlagshipRoot';

/**
 * /flagship — Mode B of the cinematic-scroll flagship: React Three Fiber +
 * WebXR. One Canvas / one renderer / one scene; the camera travels between four
 * movements (Object · World · Field · Figure) as you scroll. The R3F twin of the
 * vanilla Mode-A flagship in `examples/flagship/` — same choreography, different
 * medium.
 *
 * This file is a Server Component (default). All the WebGL/XR logic lives behind
 * the `'use client'` boundary in `FlagshipRoot`, which is lazy-loaded so three
 * never enters the server bundle and degrades to a static poster when WebGL is
 * unavailable.
 */
export const metadata: Metadata = {
  title: 'Flagship · Four Movements — R3F + WebXR',
  description:
    'A scroll-driven 3D narrative in React Three Fiber with WebXR — Object, World, Field, and Figure. Runs today with zero external assets; enter VR/AR where supported.',
};

export default function FlagshipPage() {
  return <FlagshipRoot />;
}
