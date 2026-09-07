# Real-time 3D

Use a real-time renderer only when viewpoint, lighting, depth, material response, or
direct manipulation carries meaning that a still image or short video cannot.

## Scene contract

A complete scene has:

- one renderer and one owned animation loop;
- a capped pixel ratio and a resize path;
- bounded geometry, texture, light, and post-processing costs;
- loading, empty, unsupported, and context-loss states;
- a permanent poster or equivalent static composition;
- disposal of created GPU resources;
- visibility gating for off-screen work;
- reduced-motion behavior that removes automatic camera travel and loops.

Virtual or augmented reality starts only after an explicit visitor action and must
have a conventional page fallback.

## Performance decisions

Start with the smallest scene that proves the idea. Prefer shared geometry and
materials, instancing for repeated objects, compressed assets, limited transparent
layers, and one restrained post-processing chain. Reduce pixel ratio, effects, and
particle counts before removing the content fallback.

Do not infer hardware quality from one browser hint. Use capability checks plus
measured runtime behavior. Pause clocks while hidden so the scene does not jump when
it becomes visible again.

## Camera and scroll

Map scroll progress to intentional camera keyframes or a bounded curve. Keep a clear
focal subject, avoid clipping through geometry, and maintain enough stable time to
read nearby copy. On touch devices, shorten the path or replace it with a sequence of
stable views in normal flow.

## Proof

Verify the poster before renderer initialization and after a simulated failure.
Exercise resize, restored scroll position, context recovery, page visibility, and
cleanup. Use a real device for performance claims; software rendering can prove
layout and error handling but not GPU speed.
