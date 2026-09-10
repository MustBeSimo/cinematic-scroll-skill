export type QualityTier = 'high' | 'balanced' | 'low' | 'static';
export interface CinematicSignals {
  scroll: { y: number; progress: number; velocity: number; direction: number };
  pointer: { x: number; y: number; normalizedX: number; normalizedY: number; velocityX: number; velocityY: number; active: boolean };
  visible: boolean; reducedMotion: boolean; coarsePointer: boolean; quality: QualityTier; time: number; delta: number;
}
export interface ProximityValue { distance: number; amount: number; x: number; y: number }
export interface CinematicRuntime {
  signals: CinematicSignals;
  tick(now: number): boolean; refresh(): void; wake(): void;
  subscribe(fn: (signals: CinematicSignals) => boolean | void): () => void;
  read(fn: (signals: CinematicSignals) => void): () => void;
  continuous(owner?: unknown): () => void;
  track(element: Element, options?: { radius?: number }): { readonly current: ProximityValue; dispose(): void };
  setQuality(value: QualityTier | 'auto'): void; dispose(): void;
}
export interface RuntimeOptions {
  scroller?: Window | HTMLElement; clock?: 'internal' | 'external'; initialQuality?: Exclude<QualityTier, 'static'>;
  quality?: QualityTier | 'auto'; onError?: (error: unknown) => void; onWake?: () => void;
}
export function createCinematicRuntime(root: Element | Document, options?: RuntimeOptions): CinematicRuntime;
