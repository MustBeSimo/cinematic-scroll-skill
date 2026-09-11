/* ============================================================================
   Maya Torres — Creative Director portfolio ("The Cut")
   Data for the image generator (generate.mjs) and a readable map of the page.
   index.html is a single self-contained file: its markup is static (no-JS shows
   every chapter) so this module is NOT imported by the page — keep the copy
   here in sync with index.html when you regenerate assets.
   Fictional persona — no real people or brands.

   Aesthetic: monochrome (ink / greys / white) + one electric-blue accent.
   Concept: the portfolio is a film edit. The scroll is the playhead (live
   timecode + frame counter), chapters cut hard between grounds, and the
   "Selected work" sequence runs as a pinned four-frame reel.
   ========================================================================== */

export const ACCENT = '#0F4CFF';          // electric blue — accent words + CTA
export const PALETTE = {
  ink:   '#111113',
  grey:  '#E7E6E3',
  grey2: '#CFCFD3',
  white: '#FFFFFF',
  muted: '#5E5E66',
  accent: ACCENT,
};

/* Each chapter:
   - id           folder-safe slug → asset filename (assets/<id>.jpg)
   - eyebrow      small mono label
   - title        array of [chunk, accent?]  (accent:1 → electric-blue chunk)
   - body         supporting paragraph (creative-director voice)
   - fig / figLabel  caption for the still (where one is shown in flow)
   - ground       'light' | 'paper' | 'dark' — the colour stop this chapter cuts to
   - gesture      the kinetic-type gesture the chapter uses
   - prompt       image prompt used by generate.mjs (monochrome, NO text/logos)
*/
export const CHAPTERS = [
  {
    id: '0-hero',
    eyebrow: 'CREATIVE DIRECTION · BRAND, FILM, PRODUCT',
    title: [['MAYA', 0], ['TORRES', 1]],
    body: 'Two decades turning products into culture — and the last twelve years shaping how the world feels about the objects in its pockets.',
    fig: 'SLATE', figLabel: 'TAKE 01 · 24 FPS',
    ground: 'light', gesture: 'letters rise (one-shot on load)',
    prompt: 'High-contrast black-and-white editorial portrait of a confident creative director in their late 30s, dramatic single-source studio light, deep shadows, fine film grain, minimalist grey seamless background, shot on medium format, no text, no logos, fashion-editorial restraint, cinematic monochrome'
  },
  {
    id: '1-belief',
    eyebrow: '01 · THE BELIEF',
    title: [['Great work earns its place', 0], ['in culture.', 1]],
    body: 'Creative that does not enter the conversation is decoration. Every brief starts with one question: will anyone outside this room care? If not, we start again.',
    fig: 'FIG. 01', figLabel: 'THE STUDIO FLOOR, 06:40',
    ground: 'paper', gesture: 'words slide in on opposite axes',
    prompt: 'Black-and-white documentary photograph of an empty modern creative studio at dawn, raw concrete floor, large windows, a single chair, long shadows, high contrast, fine grain, architectural minimalism, vast negative space, no people, no text, no logos, monochrome editorial'
  },
  {
    id: '2-work',
    eyebrow: '02 · THE REEL',
    title: [['Selected', 0], ['work.', 1]],
    body: 'Four frames, one playhead. See REEL below.',
    fig: 'FRAME 01', figLabel: 'WEARABLE LAUNCH FILM',
    ground: 'dark', gesture: 'pinned reel: hard cuts, per-letter rise from in-frame progress',
    prompt: 'Abstract macro photograph of a sculptural premium consumer-electronics form in brushed aluminium and matte black, floating on pure black, single dramatic rim light, glossy reflections, no recognisable brand, no logos, no text, high-contrast monochrome product photography, museum lighting, fine grain'
  },
  {
    id: '3-craft',
    eyebrow: '03 · THE CRAFT',
    title: [['The messy,', 0], ['meaningful', 1], ['middle.', 0]],
    body: 'I live between the blank page and the final release — leading multidisciplinary teams that feel safe taking real creative risks.',
    fig: 'FIG. 03', figLabel: 'PROCESS, IN MOTION',
    ground: 'light', gesture: 'tracking stretches with scroll',
    prompt: 'Black-and-white motion-blurred photograph of hands arranging printed storyboards and contact sheets on a large table, overhead light, scattered film stills, intense focus, documentary grain, high contrast, no faces, no text, no logos, monochrome editorial reportage'
  },
  {
    id: '4-recognition',
    eyebrow: '04 · RECOGNITION',
    title: [['Grand', 0], ['Prix.', 1]],
    body: 'Grand Prix · Pencil for cultural impact · 11 metals across film + craft · one identity in 28 markets.',
    fig: 'FRAME 04', figLabel: 'GRAND PRIX ANTHEM',
    ground: 'dark', gesture: 'close: type scales up into place — the type is the image',
    prompt: 'Dramatic black-and-white still life of an abstract minimalist award trophy form, a tall geometric monolith, single hard backlight creating a halo, deep black surroundings, glossy reflections, fine grain, no text, no logos, no engraving, high-contrast monochrome, gallery lighting'
  },
  {
    id: '5-invitation',
    eyebrow: '05 · THE INVITATION',
    title: [['Let’s make work that', 0], ['matters →', 1]],
    body: 'Open to select partnerships with ambitious brands and collaborators who believe in brave ideas. The page is blank and the cursor is blinking.',
    fig: 'FIG. 05', figLabel: 'THE OPEN PAGE',
    ground: 'paper', gesture: 'direct action: mailto in the headline + CTA',
    prompt: 'Minimalist black-and-white photograph of a single blank sheet of heavy paper on a vast empty desk, one shaft of hard window light, long shadow, immense negative space, fine grain, high contrast, no text, no logos, no writing, monochrome editorial, quiet and confident'
  },
];

/* REEL — the signature sequence. Four full-bleed frames on a pinned stage
   (desktop, motion allowed) or a stacked contact sheet in flow (mobile,
   reduced motion, no JS). Two frames are stills, two are procedural artwork
   built in the page (SVG bar-field, CSS poster triptych) — no blank cards. */
export const REEL = [
  { idx: '01', year: '2014', title: 'Wearable', label: 'Wearable launch film',    meta: 'FILM · GLOBAL',    art: 'assets/2-work.jpg (2.39:1 letterbox)' },
  { idx: '02', year: '2017', title: 'Identity', label: 'Audio platform identity', meta: 'BRAND · 28 MKTS',  art: 'procedural SVG: 28 bars, two in accent' },
  { idx: '03', year: '2020', title: 'Pocket',   label: 'Pocket-device campaign',  meta: 'OOH · PLATFORM',   art: 'procedural CSS: three poster panels, tilting device' },
  { idx: '04', year: '2023', title: 'Anthem',   label: 'Grand Prix anthem',       meta: 'FILM · CRAFT',     art: 'assets/4-recognition.jpg (2.39:1 letterbox)' },
];
