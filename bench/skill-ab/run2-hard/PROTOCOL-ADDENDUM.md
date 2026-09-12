# Run 2 — hard brief (addendum to ../PROTOCOL.md; committed before any build)

Same three conditions, model, isolation, tool set and caps as run 1, on a brief that
exercises what the skill claims: real-time 3D from a local GLB, three pinned scroll
chapters, an environment map that the kit lists but does not deliver, and complete
no-JS / reduced-motion / WebGL-failure fallbacks.

Skill under test: v2.7.6 + the verbatim-copy rule, commit `6babe60`. The rule was added
because run 1 found the skill build inventing copy; run 2 tests the corrected skill.
Prompt B was written before any run-2 build, with the 3D/fallback expertise a strong
practitioner would bring.

Measurements as in run 1, over local HTTP, plus: served-page console/runtime errors with
the hero asset present, and the same checks after `kit/assets/vessel.glb` is renamed away
(failure injection) — the poster must remain and no uncaught error may occur.
Human blind rating: the user, author-rated, recorded as such.
Cap: three builds. No reruns.
