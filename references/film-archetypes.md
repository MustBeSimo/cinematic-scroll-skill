# Film Archetypes for Scroll Design

> Every scroll site has a director. Most don't know it. This file lets you choose yours intentionally.

Each archetype below maps a director's visual grammar to a concrete scroll design system — not film analysis, but production-ready rules for pacing, color, type, depth, and transitions. When a brief aligns with a director, every decision becomes easier because you are working from a coherent visual language, not a mood board.

---

## 1. Stanley Kubrick
*2001: A Space Odyssey, The Shining, Barry Lyndon*

### Scroll Behavior
One-point perspective, slow deliberate movement, and absolute symmetry. The scroll axis becomes a corridor — the user moves forward into depth, not sideways across a page. Every pinned section is a "room" viewed from a single fixed vantage point. The camera never rushes. Reveals happen at glacial speed, forcing the user to sit with the composition before the next element arrives.

### Color Philosophy
Desaturated primaries with sudden violent accents. A Kubrick palette lives in muted creams, cold institutional blues, and warm tungsten ambers — then a single frame of arterial red shatters the calm. Color is not decoration; it is narrative punctuation. Use `#C41E3A` against `#E8E0D4` and let the red do all the screaming.

### Pacing Signature
Slow, symmetrical, metronomic. Pins run 300-400vh (the upper limit — Kubrick earns it). Title reveals take 40% of the pin range. Stagger is wide: 12-15% between elements, creating space for dread to accumulate. Easing is `power1.inOut` — no drama in the curve, all drama in the duration.

### Typographic Voice
Futura (or geometric sans-serif substitute), tracked out, centered, monumental. Titles at 120px+, all caps, `letter-spacing: 0.15em`. Body copy is small, almost whispered — 14px, `line-height: 1.6`, left-aligned in narrow 40ch columns. The contrast between screaming titles and timid body creates hierarchy through aggression.

### Depth Strategy
4-5 layers maximum, arranged in strict one-point perspective. Background layers drift at 0.1x and 0.25x. Midground holds the subject at 0.5x. Foreground elements (door frames, architectural edges) at 0.8x. The vanishing point never moves. All layers converge to a single coordinate — typically 50% horizontal, 40% vertical.

### Transition Style
Hard cuts. No fade, no slide, no dissolve. One section ends; the next begins instantly. The harshness of the cut is the transition. If a color morph is necessary, it happens inside a single pinned section — never between sections.

### Applied Example
A **law firm** wanting **authority and stillness** should reference this. A **museum** wanting **classical reverence** should reference this. A **luxury real estate** brand selling **architectural space** should reference this.

---

## 2. David Fincher
*Fight Club, Gone Girl, The Social Network*

### Scroll Behavior
Clinical precision, data-driven composition, and invisible technique. The scroll feels like a camera on a dolly track — perfectly smooth, no vibration, no flourish. Information arrives on a need-to-know basis. The user scrolls and something is revealed, but the mechanism of the reveal is invisible. No snap scroll. No whip pans. The motion is the absence of motion.

### Color Philosophy
Desaturated to the point of near-monochrome. Fincher's palette is ash grey, steel blue, sickly yellow-green, and black. Saturation never exceeds 30%. When color does appear — a warm skin tone, a red wine stain — it reads as an event because the surrounding world has been drained of it. Use `#3A3A3A`, `#7A8B99`, `#2C2C2C` as base; introduce `#C9A96E` (amber) only for interactive elements.

### Pacing Signature
Medium-slow, uniform, relentless. 200-250vh pins. Title reveals are 35% of pin range — not rushed, not leisurely. Stagger at 6-8%. The rhythm is a heartbeat: consistent, unhurried, unsettling in its regularity. Easing is `power2.inOut` — smooth acceleration and deceleration, no accent, no personality. The curve says "this is inevitable."

### Typographic Voice
Helvetica Neue (or Inter, or SF Pro), medium weight, meticulously sized. Titles at 64-80px, sentence case, `letter-spacing: -0.02em` (tight, confident). Body at 16px, `line-height: 1.6`, neutral. No serifs. No personality in the type — the personality is in the spacing, the sizing, the silence around the words.

### Depth Strategy
3 layers, shallow depth. Background at 0.15x, content at 0.5x, a subtle texture overlay at 0.9x. Fincher does not do deep parallax — depth is implied through focus, not motion. The shallow stack keeps the composition flat and controlled, like a framed photograph that happens to move slightly.

### Transition Style
Fade through black. Not a crossfade — a fade-to-black, hold for one beat (20vh of scroll darkness), then fade up to the next chapter. The darkness is a palate cleanser. It resets the user's visual state before the next information payload arrives.

### Applied Example
A **fintech app** wanting **trust and precision** should reference this. A **SaaS platform** wanting **clinical professionalism** should reference this. A **news organization** wanting **gravitas without pomposity** should reference this.

---

## 3. Wes Anderson
*The Grand Budapest Hotel, Moonrise Kingdom, The Royal Tenenbaums*

### Scroll Behavior
Flat, snap-to-grid, centered compositions with lateral movement. The scroll axis becomes a horizontal dolly (even on a vertical page — use `translateX` driven by vertical scroll progress). Every element is centered or perfectly symmetrical. The camera moves in straight lines: left, right, up, down — never diagonal, never organic.

### Color Philosophy
Pastel, saturated, playful. Anderson's palette is a box of macarons: dusty rose `#D4A5A5`, butter yellow `#F4E4BC`, mint green `#A8D5BA`, baby blue `#A8C8EC`, lavender `#C9B8D8`. Colors do not blend; they butt against each other in hard-edged blocks. Each chapter gets one dominant pastel with a complementary accent.

### Pacing Signature
Fast, rhythmic, symmetrical. Short pins at 150-180vh. Title reveals are snap-quick: `power4.out`, 0.4s duration, word-stagger at 4%. The user should feel like they are flipping through a beautifully designed book, not scrolling a website. Rhythm is everything — the pacing should have a musical quality, like verses in a pop song.

### Typographic Voice
Futura (or similar geometric sans) for display, sometimes a slab serif for contrast. Titles at 80-100px, centered, `letter-spacing: 0.08em`, often in all-caps. Body copy is small, centered, almost decorative — 13-14px, `line-height: 1.5`, in narrow 35ch columns. Type is treated as a visual element first, a reading element second.

### Depth Strategy
2-3 layers, explicitly flat. Background is a solid color or simple pattern. Midground holds the subject. Foreground has a decorative border or frame element. Parallax rates are minimal: 0.1x, 0.4x, 0.7x. The flatness is the point — depth is suggested through scale and overlap, not through perspective.

### Transition Style
Hard lateral wipes. One chapter slides out to the left while the next slides in from the right — perfectly synchronized, 0.5s, `power2.inOut`. The wipe is a curtain change between acts. No fade, no dissolve. The seam between chapters is visible and intentional, like turning a page in a pop-up book.

### Applied Example
A **boutique hotel** wanting **whimsical charm** should reference this. A **bakery or food brand** wanting **playful sophistication** should reference this. A **children's product** wanting **nostalgic warmth without childishness** should reference this.

---

## 4. Christopher Nolan
*Inception, Interstellar, Dunkirk*

### Scroll Behavior
Layered timelines, dramatic scale shifts, and time-bending transitions. The scroll experience should feel like moving through nested realities — foreground action, midground context, background cosmic scale, all moving at different rates. Use nested pinned sections (a pin within a pin) to create the "dream within a dream" effect. The user scrolls through one timeline and discovers another underneath.

### Color Philosophy
Dramatic chiaroscuro. Nolan's palette is built on extreme contrast: deep blacks `#0A0A0A`, cold steel highlights `#C8D8E8`, and warm practical lights `#E8C97A` (tungsten, fire, sun). Shadows are not grey — they are black. Highlights are not white — they are colored by their source. Every frame reads as a painting by candlelight or starlight.

### Pacing Signature
Variable, relentless, driven by score. Use Nolan's "Shepard tone" approach to pacing: always ascending, never resolving. Alternate between 250vh slow-burn pins (dialogue, exposition) and 120vh high-velocity snaps (action, transition). The contrast between slow and fast creates the feeling of unstoppable momentum. Easing: `power3.inOut` for slow sections, `power4.in` for snap transitions.

### Typographic Voice
Clean sans-serif ( Gotham, Montserrat, or similar) for titles, large and authoritative — 100px+, `font-weight: 700`, `letter-spacing: -0.03em`. Body copy is neutral, readable, almost invisible — 15px, `line-height: 1.7`. The type does not draw attention to itself; it delivers information so the visuals can do the dramatic work.

### Depth Strategy
5-7 layers — the deepest stack of any archetype. Background cosmic/environmental layers at 0.05x and 0.12x. Architectural/context layers at 0.25x and 0.4x. Subject layers at 0.6x and 0.75x. A foreground detail layer at 0.9x. The extreme depth separation between background (nearly static) and foreground (fast) creates the sense of cosmic scale.

### Transition Style
Inversion cuts. One section's color palette is the photographic negative of the next — warm → cold, bright → dark, saturated → desaturated. The transition is not a motion but a reality shift. Accompany with a `rotateX(2deg)` tilt that rights itself over the first 20% of the new pin.

### Applied Example
A **space or deep-tech startup** wanting **cosmic scale** should reference this. A **venture capital firm** wanting **ambition and gravity** should reference this. A **cinematic game launch** wanting **event-level drama** should reference this.

---

## 5. Denis Villeneuve
*Blade Runner 2049, Dune, Arrival*

### Scroll Behavior
Vast negative space, atmospheric haze, and slow revelation. The user scrolls through emptiness — a desert, a fog bank, a dark screen — and gradually, impossibly slowly, forms emerge from the atmosphere. The scroll is not about delivering information quickly; it is about creating the conditions for awe. Every pinned section starts empty and ends populated.

### Color Philosophy
Atmospheric, desaturated, warm-cold duality. Villeneuve's palette shifts between two registers: warm dust (ochre `#B8956A`, sand `#C4A882`, haze `#D4C5A9`) and cold steel (slate `#5A6670`, ice `#8BA4B4`, shadow `#1E2328`). No bright primaries. No saturated greens. The world is either burning or freezing, and the tension between the two is the palette's engine.

### Pacing Signature
Glacial, then sudden. Pins at 280-350vh — the longest of any archetype. The first 60% of the pin is atmospheric: background drifts, haze thickens, a distant shape becomes barely visible. The final 40% delivers the reveal: title, subject, call-to-action. The asymmetry is crucial — the wait must be longer than the payoff, or the payoff feels cheap. Easing: `none` (linear) for atmospheric drift; `power2.out` for the reveal.

### Typographic Voice
Sharp, thin, spaced-out sans-serif (Helvetica Neue Light, or thin weight Inter). Titles at 90-120px, `font-weight: 200`, `letter-spacing: 0.2em`, uppercase. The thinness of the type lets it sit lightly on the image — it does not compete with the visual atmosphere, it annotates it. Body copy is minimal: 14px, `line-height: 1.8`, never more than 3 short paragraphs per chapter.

### Depth Strategy
3-4 layers, but used for atmosphere, not objects. Layer 1 (0.05x): background image, slow drift. Layer 2 (0.2x): atmospheric haze / gradient overlay, opacity shifts with scroll. Layer 3 (0.5x): primary subject, revealed late. Layer 4 (0.85x): dust particles or texture, subtle parallax. The haze layer is the secret weapon — a semi-transparent gradient that shifts opacity based on scroll progress, creating the sense of emerging from fog.

### Transition Style
Atmospheric bleed. The outgoing section's haze expands to fill the viewport (opacity 0 → 1 over 40vh), holds (20vh), then the incoming section's haze contracts (opacity 1 → 0). The user never sees a hard edge — they move through a cloud between worlds.

### Applied Example
An **automotive brand** wanting **scale and presence** should reference this. A **premium spirits** company wanting **ritual and atmosphere** should reference this. A **documentary or nature brand** wanting **reverence for landscape** should reference this.

---

## 6. Greta Gerwig
*Lady Bird, Little Women, Barbie*

### Scroll Behavior
Warm, intimate, character-driven, with playful formal experiments. The scroll feels like flipping through a personal scrapbook — handwritten notes, pressed flowers, Polaroid snapshots, all arranged with affectionate chaos. Motion is quick, energetic, and slightly imperfect. Elements do not glide; they bounce, wobble, and settle. The imperfection is the point.

### Color Philosophy
Warm, saturated, emotionally direct. Gerwig's palette is a summer afternoon: warm pink `#E8927C`, butter yellow `#F5D76E`, sage green `#8FA68E`, dusty blue `#7BA7BC`, cream `#F5F0E8`. Colors are saturated but not electric — they feel found, not designed. Each chapter has a dominant warmth that shifts subtly in hue (rose → peach → amber) to create emotional progression.

### Pacing Signature
Quick, varied, conversational. Short pins at 150-200vh. Rapid title reveals (word-stagger at 5%, `back.out(1.2)` easing — the slight overshoot feels hand-placed, not machine-perfect). Unexpected pauses: a 30vh "breathing room" section with nothing but a centered quote in italic script. The rhythm mimics conversation — quick, quick, pause, quick, longer pause.

### Typographic Voice
Mixed voices: a bold serif (Playfair Display, Cormorant) for titles at 72-96px, `font-weight: 600`, sometimes italic. A friendly sans-serif (Nunito, Quicksand) for body at 15px, `line-height: 1.65`. Occasional handwritten or script moments for pull quotes — 32px, casual, slightly rotated (`rotateZ(-1deg)`). The type mixing is intentional — it feels collected over time, not designed in one sitting.

### Depth Strategy
4-5 layers, shallow but playful. Background at 0.1x (warm solid or soft gradient). Photo/subject layers at 0.3x and 0.6x, sometimes with slight `rotateZ` (±1deg) that corrects on scroll. Decorative elements (stars, hearts, doodles) at 0.8x with `back.out` entrance. The parallax is gentle — nothing dramatic. The charm is in the accumulation of small details, not in cinematic depth.

### Transition Style
Scrapbook page-turn. The outgoing section scales down to 0.9x and fades while the incoming section scales up from 0.9x to 1.0x and fades in — 0.6s overlap, `power2.inOut`. It feels like turning a page in a photo album. The slight scale change is the "page turn" gesture.

### Applied Example
A **lifestyle brand** wanting **warmth and approachability** should reference this. A **fashion label** targeting **Gen-Z with heart** should reference this. A **wellness or self-care product** wanting **intimacy, not clinical detachment** should reference this.

---

## 7. Chloé Zhao
*Nomadland, The Rider, Eternals*

### Scroll Behavior
Natural light, landscape-scale, empathetic and fluid. The scroll is not a camera move — it is wind, it is water, it is the slow turning of the earth. Motion is organic, never geometric. Parallax layers drift at slightly irregular rates (add `±0.02` randomness to each layer's rate). Transitions feel like weather changing, not like edits.

### Color Philosophy
Natural, golden-hour, ungraded. Zhao's palette is drawn from the American West at dusk: wheat `#C9B687`, rust `#B86D4B`, sage `#8B9A7D`, sky-blue `#A8C4D9`, earth-brown `#5C4A3A`. Colors are warm but not saturated — they feel sun-bleached, wind-worn, honest. No neon. No pure white. The whites are warm (`#F5F0E8`), the blacks are brown (`#2C2420`).

### Pacing Signature
Slow, patient, then unexpectedly intimate. Pins at 250-320vh. The first half establishes the landscape — vast, slow-moving, almost static. The second half brings in the human element: a face, a hand, a handwritten letter. The shift from landscape to face is the emotional payload. Easing: `power1.out` for everything — gentle deceleration, no snap, no aggression.

### Typographic Voice
Humanist serif (Crimson Text, Merriweather, or Source Serif) for everything — titles and body. Titles at 56-72px, `font-weight: 400`, `letter-spacing: 0.01em`, sentence case. Body at 16px, `line-height: 1.75`, generous paragraph spacing (`margin-bottom: 1.5em`). The type feels like a letter from a friend — warm, unhurried, personal.

### Depth Strategy
3 layers, landscape-oriented. Background: horizon line at 35% from top, sky above, land below, drifting at 0.08x. Midground: the subject (person, vehicle, structure) at 0.35x, anchored to the landscape. Foreground: tall grass, dust, or atmospheric elements at 0.7x, creating a natural frame. The layers are shallow but the content (vast landscape, small human) creates the depth psychologically.

### Transition Style
Light dissolve. The outgoing section's brightness increases (filter-like brightness via pre-brightened asset crossfade) while opacity fades — simulating walking into sunlight. The incoming section fades in from a slightly lower brightness. The metaphor is: moving through time, through weather, through a day. No hard edges. No cuts.

### Applied Example
A **sustainable brand** wanting **authenticity and land-connection** should reference this. A **travel or outdoor company** wanting **wanderlust without adrenaline** should reference this. A **non-profit or social cause** wanting **empathy and human-scale storytelling** should reference this.

---

## How to Use This File

1. **Read the brief.** What emotion should the site produce? What is the brand's personality?
2. **Match to a director.** Not literally — match the *grammar*. A fintech app is Fincher. A boutique hotel is Anderson. A space startup is Nolan.
3. **Apply the system.** Use the director's color philosophy, pacing signature, type voice, depth strategy, and transition style as your constraints. Every decision filters through the archetype.
4. **Never mix more than 2 directors.** A Kubrick-Fincher hybrid works (cold, controlled, precise). A Nolan-Gerwig hybrid does not (cosmic scale vs. intimate scrapbook). If the brief demands hybridity, choose one primary and one accent director — never equal parts.
5. **Document the choice.** In the section manifest, note which director archetype is primary. This prevents drift mid-project.
