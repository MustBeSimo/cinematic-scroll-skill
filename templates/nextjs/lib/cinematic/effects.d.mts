import type { CinematicRuntime } from './cinematic.mjs';
export type TextVariant = 'line-mask' | 'word-cascade' | 'character-wave' | 'velocity-skew' | 'scramble' | 'variable-axis';
export const TEXT_VARIANTS: TextVariant[];
export function mountProximity(element: HTMLElement, runtime: CinematicRuntime, options?: { variant?: string; radius?: number; strength?: number }): () => void;
export function mountText(element: HTMLElement, runtime: CinematicRuntime, options?: { variant?: TextVariant; duration?: number; stagger?: number; weightFrom?: number; weightTo?: number }): () => void;
export function mountDeclarativeEffects(root: Element | Document, runtime: CinematicRuntime): () => void;
