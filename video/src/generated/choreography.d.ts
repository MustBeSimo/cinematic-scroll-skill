/* Types for the auto-generated choreography module (compile-choreography.mjs --target video). */
export declare const CHOREOGRAPHY_DURATION: number;
export declare function buildChoreographyTimeline(gsap: unknown): {
  seek: (time: number, suppressEvents?: boolean) => void;
  kill: () => void;
  duration: () => number;
};
