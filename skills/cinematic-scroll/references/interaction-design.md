# Interaction design

Use interaction to let the visitor understand the subject by changing it.

## Subject, action, consequence

Define three connected parts:

1. **Subject:** the thing being examined.
2. **Action:** a scroll segment, drag, pointer move, range input, toggle, or button.
3. **Consequence:** an immediate visual or spatial change that teaches something.

Good controls expose a meaningful parameter: material finish, layer separation,
density, route position, comparison state, or camera point of view. Weak controls
change a label while the scene stays the same.

## Control requirements

- Prefer native buttons, range inputs, and disclosure elements.
- Give every control a visible label and keyboard path.
- Show the current value only when it aids understanding.
- Provide reset when the visitor can substantially alter the scene.
- Provide pause for recurring decorative motion.
- Keep the control close enough to the scene that cause and effect are obvious.
- Do not require a precise drag gesture for essential content.

## Motion and state

Render the first useful state without interaction. Preserve state changes when the
control receives keyboard input. If the scene is expensive, schedule one render per
frame and pause its loop when hidden.

Reduced motion should settle the scene and remove automatic drift. Manual changes
can remain when they are direct, brief, and do not produce disorienting travel.

## Proof

Test the scene region itself at two control endpoints. A text-value change does not
prove the visual reacted. Confirm reset restores the starting state, pause stops the
recurring change, and no errors occur during repeated interaction.
