/**
 * Shared scroll-velocity bus for the flagship rail.
 *
 * `ScrollCameraRig` writes a damped, normalized travel speed here each frame;
 * the FX layer (rail dust, FOV kick, post grading) reads it. A module-level
 * mutable holder — not state, not context — because this value changes every
 * frame and must never trigger React renders (`3d-stack.md` §5).
 */
export const railVelocity = { current: 0 };
