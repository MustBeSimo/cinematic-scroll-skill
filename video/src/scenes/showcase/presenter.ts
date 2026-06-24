// Presenter (HeyGen avatar) wiring for SkillShowcase.
// `PRESENT` is flipped to true by video/scripts/heygen-presenter.mjs once it has
// downloaded the talking-head clip to public/showcase/presenter.mp4. Until then the
// PiP renders a branded placeholder, so the video always renders (Montage pattern).
export const PRESENTER = {
  PRESENT: true,
  SRC: 'showcase/presenter_new.mp4',
  // frame the narration audio starts (aligned to the first content scene)
  AUDIO_START: 68,
} as const;
