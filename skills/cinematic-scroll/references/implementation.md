# Implementation

## Preserve the host project

Use the installed framework, routing, design tokens, scroll provider, and animation
library. Integrate at a real component or route. Add a dependency only when the
project lacks the required capability and the user has accepted the tradeoff.

For a standalone concept, one HTML file with inline styles and a small script is a
good default. If it imports modules or media, serve it over local HTTP and state that
requirement in the handoff.

## Progressive enhancement

The initial document should already contain the complete reading order and primary
action. Attach motion after dependencies, fonts, media dimensions, and geometry are
ready. Avoid a global initial state that hides all content before setup succeeds.

Use a small enhancement boundary for each scene:

1. detect capability and motion preference;
2. initialize only the supported branch;
3. store owned listeners, observers, timelines, and frame handles;
4. clean up only those owned resources;
5. restore the static composition when the branch changes or fails.

## Scroll ownership

Use one scroll clock. Reuse an existing smooth-scroll instance and do not add a
second smoothing layer. Native scroll is often the best choice for modest effects.

Each animated property should have one owner. When entrance, parallax, and pointer
tilt all affect an element, nest wrappers so they do not overwrite the same transform.
Keep the pin shell responsible for layout and animate a child inside it.

Read geometry outside frequent write loops. Refresh after fonts, images, containers,
or viewport dimensions change. Do not refresh on every scroll event.

## Responsive behavior

On narrow or coarse-pointer devices:

- keep important content in natural flow;
- shorten translations and pinned distances;
- reduce simultaneous layers;
- disable hover-only effects;
- keep controls reachable without precision gestures;
- ensure fixed overlays do not cover navigation or the final action.

For reduced motion, remove continuous movement and scroll hijacking rather than
merely changing durations to zero. Make the settled state visible and preserve the
same content and destination links.

## Failure states

Media, module, and renderer failures need designed outcomes. Reserve aspect ratios,
show a useful poster or styled background, keep explanatory text above the failure,
and bound loaders so they cannot cover the page indefinitely.
