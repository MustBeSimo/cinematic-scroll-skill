# Architectural surface studies

Atelier Marne and Verdant use locally hosted 1K CC0 texture sets from Poly Haven.
Exact download URLs, byte sizes and licenses are in [sources.json](sources.json).

- [Plastered Wall](https://polyhaven.com/a/plastered_wall): Atelier Marne walls and plinths.
- [Wood Floor](https://polyhaven.com/a/wood_floor): Atelier Marne timber flooring.
- [Concrete Floor 02](https://polyhaven.com/a/concrete_floor_02): Verdant's weathered structure and paving.
- [Concrete Moss](https://polyhaven.com/a/concrete_moss): Verdant's beds, edging and vines.

Diffuse maps use sRGB. OpenGL normals and packed AO/roughness/metal maps stay
linear; packed red supplies occlusion and green supplies roughness. Texture
coordinates use local metres instead of stretching one tile across a hallway.
Maps are shared between material variants; anisotropy is capped at eight.
Leaf colour, vein and bump detail are generated locally by the shared helper.

Both scenes retain their original camera routes and controls. Atelier adds a
bevelled arched threshold, satin floor coating and one shadowed spotlight.
Verdant adds bevelled column bases, attached foliage clusters with anchored tip
motion, and one camera-following directional shadow map. Shadow maps are 1024px
desktop / 512px mobile; DPR stays capped at 1.5 / 1.0.

The forest panorama is an existing generated asset, used as a distant backdrop
and image-based lighting. It is not geometric forest detail. No new AI generation
or paid rendering was used.

Missing texture maps fall back to base materials. The existing poster survives
WebGL failure; reduced motion, pause, context recovery and mobile layouts remain.
