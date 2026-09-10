# Scenes visitors can explore

Read for an interactive hero, generative scene, or flagship improvement. A gallery
redesign also needs an inventory of existing examples, links, and visual strengths
before changing navigation. Preserve access to useful work when regrouping it.

## Start with a visitor action

Name the subject, the action, and the visible consequence. Examples: separate a
product's layers to explain construction; change light to inspect a material;
adjust wind to see an atmosphere change. A slider should expose the subject's
behavior, not merely change an arbitrary decoration.

Choose the smallest rendering method that makes this legible: SVG for an authored
object diagram, Canvas 2D for trails and fields, WebGL for physical materials or
spatial traversal. Rendering complexity is not a measure of originality.

## A complete interaction

- Establish a compelling default composition before inviting interaction.
- Give each control a visible label, useful range, and immediate scene response.
- Provide reset; provide pause for continuous motion. Use native inputs/buttons
  so keyboard, touch, and assistive technology receive the same behavior.
- Keep control state and scene state in one owner. Connect to the existing render
  loop; don't add a second clock. Preserve values after context restoration.
- Under reduced motion, draw changes on explicit input and keep idle motion off.
  Missing WebGL leaves the poster and story; hide controls that cannot work.
- Test both ends of each range, reset, pause/resume, reverse navigation, and an
  input while paused. A changed readout alone does not prove scene integration.

Keep prose and controls outside the visual's important silhouette. Resist filling
the opening with giant type if it obscures the thing the visitor came to see.
When improving a flagship, show evidence of the scene change itself; new cards,
navigation, and marketing copy do not establish an improved flagship experience.

## Bundled 3D examples

Start with the scene that fits the subject. Choose camera travel for a place,
material response for an object, or a changing field for a process. Reuse the
mechanism and lifecycle; derive palette, typography and composition from the
user's brand. The showcase's ordering is not a ranking of which scene fits a brief.

| Example | Useful mechanism |
|---|---|
| [Aureus](../examples/aureus-flythrough/index.html) | Scroll through reflective chrome volumes |
| [Atelier Marne](../examples/gallery-flythrough/index.html) | Walk between artwork and sculpture; adjust gallery exposure |
| [Verdant](../examples/jungle-flythrough/index.html) | Instanced curved foliage, planted borders and adjustable sunlight |
| [Aether](../examples/flagship/index.html) | Dwell on an object before moving into the next spatial chapter |
| [Obsidian](../examples/crystalline-monolith/index.html) | Explore the change from polished to frosted transmission glass |
| [Weather](../examples/volumetric-aether/index.html) | Change the density of rounded, self-shadowing cloud banks |
| [Nexus](../examples/immersive/index.html) | Tune a particle field and wave displacement, including on mobile |

Five studies use [one demand-aware scene session](../examples/_scene-session.js).
Aether retains its XR-compatible animation loop. Use elapsed time for drift and
damping; stop scheduling frames when motion is paused, reduced or hidden. A
control can request a frame while paused. Reduced motion holds the camera while
the text continues to scroll. Recover generated environment maps after context
loss: restoring the renderer alone can leave reflections black.

Run `npm run test:scenes` against a local HTTP server on port 8875 (or set
`SCENE_PREVIEW_URL`). The browser regression verifies visible scene changes from
keyboard input while paused, reset, live and initial reduced motion, context
restoration, narrow layouts and readable no-JS content. Inspect the screenshots
as well; passing the tests does not establish the quality of a composition.

## A graphical mechanism to adapt

[FIELD's standalone iris](../examples/v3-flagship/README.md) demonstrates a control
that reveals more of one authored subject. It uses SVG plus the shared scroll clock;
explicit input still works while continuous motion is paused or reduced. Its
[interaction regression](../examples/v3-flagship/interaction.test.mjs) checks scene
changes, reset, static input, and control geometry. Use this route for a graphical
mechanism; the Next.js FIELD route is a separate real-3D interpretation.

When adapting it, replace the subject and story first. Retain the useful separation
between visitor-controlled parameters and scroll-controlled viewpoint, rather than
copying an optical theme into an unrelated brief.

## Reference studies

MiaAI Lab's [Astra collection](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/)
and [comparison gallery](https://miaai-lab.github.io/Fable-5.1-100-HTML-Files/)
provide small, inspectable experiments with published prompts. These are external
references, not bundled code or benchmark evidence for this skill.

| Study | Transferable question |
|---|---|
| [Aero Form](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/025-aero-form.html) | Does exposing structure explain the object's character? |
| [Ink Diffusion](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/049-ink-diffusion.html) | Can a visitor gesture create the focal visual? |
| [Fourth Dimension](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/064-fourth-dimension.html) | Does a parameter make an abstract concept understandable? |
| [Aerogram](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/092-aerogram.html) | Is the cause-and-effect model clear, including its limitations? |
| [Ribbon Rehearsal](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/094-ribbon-rehearsal.html) | Does the scene remember a gesture in an expressive way? |
| [Organic Wave Lab](https://miaai-lab.github.io/GPT-6-Astra-100-HTML-Files/100-organic-wave-lab.html) | Can a small control set produce visibly distinct compositions? |

Study behavior and composition; author a new subject and implementation. Do not
copy reference branding, copy, assets, or exact layouts. Compare screenshots and
interaction states before making claims about relative visual quality.
