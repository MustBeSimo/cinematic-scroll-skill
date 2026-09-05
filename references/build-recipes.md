# Build recipes and lifecycle contracts

## Standalone HTML

Inline styles and script for a portable file. Local image tags may reference
sibling files, but call that a folder bundle. Module imports, fetched textures,
or external scripts may require HTTP; provide a serving command and test before
promising double-click support.

Initial HTML/CSS is the readable static page. Attach enhancement only after its
dependencies and geometry are ready. Avoid hiding every heading with a global
`.js` class before animation setup succeeds. A CDN failure must leave useful
content. Pin dependency URLs and use verified SRI where supported; self-host when
the project requires offline delivery.

Native scrolling with scheduled rAF updates is enough for a modest section. Use
the existing GSAP setup or bundled components for coordinated pins. Read their
implementation and adapt their lifecycle instead of copying global demo scripts.

## Existing app / new Next.js

Preserve an existing framework, lockfile, scroll provider, and design system.
Integrate at a real route/component. Avoid a second library for an effect already
expressible by the installed one.

For a new Next.js app, use `templates/nextjs/`, then adapt content/styles. Inspect
its versions and adapters instead of recreating them from memory. fal.ai routes
are optional for a static-assets build. No key is needed just to preview. Run the
project's own typecheck/build and prove the rendered route.

## One clock, reversible setup

A section owns its tweens, triggers, media handlers, observers, and listeners.
Use a scoped GSAP context / `useGSAP`, and revert it at unmount. Use
`gsap.matchMedia()` for device/motion branches and revert it too. Never kill all
ScrollTriggers from a reusable component; other sections may own them.

Reuse an existing Lenis instance. If adding Lenis with GSAP, use one tick:
`lenis.on('scroll', ScrollTrigger.update)` and a named ticker callback calling
`lenis.raf(time * 1000)`. Remove that callback and destroy only instances you own.
Do not also enable `autoRaf` or add another rAF loop. Native scroll is valid;
never stack Lenis and ScrollSmoother.
[Official integration](https://github.com/darkroomengineering/lenis#setup).

Nest wrappers for entrance, parallax, and tilt. Reserve the pin shell for geometry
and move its children. Refresh after font loading and relevant container/image
size changes, not each scroll tick. Watch transformed ancestors that change the
fixed/sticky containing block.

## Progressive enhancement

Check reduced motion before setup and respond to changes. Revert pins/transforms,
cancel loops/autoplay, and restore readable flow. Zero-duration tweens alone leave
pin spacers and invisible initial states behind.

Favor natural flow and bounded translations on narrow/coarse-pointer layouts.
Tilt requires actual hover/fine-pointer capability. Missing device-memory hints
do not prove that a device is slow. Test the target browsers; use working fallback
behavior instead of blanket version assumptions.

Measure parallax from an untransformed wrapper; update viewport height on resize.
Clamp offsets to available image overscan. Stop smoothing when settled/offscreen.
Content must remain reachable through keyboard navigation and browser find.

## Evidence

- HTML: doctor and browser checks against the actual output path.
- React: project compilation and browser proof from its running URL. Static TSX
  regexes cannot measure its rendered composition.
- No JS: verify content/links, not animation. Disclose an intentionally client-only
  application's lack of a server fallback when outside the requested scope.
- Video/WebGL: test poster, decode/context failure, visibility gating, and cleanup.
  Headless software rendering is not a real GPU performance benchmark.
