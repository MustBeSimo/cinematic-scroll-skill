# Brief — Ferrymead Bakehouse

Build a single-page marketing website for **Ferrymead Bakehouse**, a small
sourdough bakery in a former ferry terminal on a river estuary. They are
launching a weekly bread subscription. The site must feel unhurried,
honest and warm — like the bakery, not like a tech startup.

## Copy (use verbatim; do not invent claims, awards, prices or quotes)

- Name: Ferrymead Bakehouse
- Tagline: Bread on the tide.
- Intro: We bake slow sourdough in the old ferry hall, with flour from two farms upriver and a starter that is older than the building's new roof.
- Section — The loaves: Estuary Loaf (country sourdough, 900 g). Rye Tide (60% rye, caraway, 800 g). Saltmarsh (sea-salt crust, wholemeal, 900 g). Ferry Crumpets (six per pack, weekends only).
- Section — The subscription: Choose one or two loaves a week. We bake Thursday night, you collect Friday from the hall or one of three pickup points along the river. Pause or cancel any week before Wednesday noon.
- Section — The hall: Built 1911, ferries stopped in 1974, ovens lit 2019. The waiting room is now the shop; the ticket office is where the starter lives.
- Section — Visit: Open Friday to Sunday, 7am until we sell out. 1 Ferry Lane, Ferrymead.
- Call to action: Start a subscription
- Footer: Ferrymead Bakehouse · 1 Ferry Lane · hello@ferrymead.example

## Hard constraints (identical for every condition)

1. Output exactly one file: `index.html` in the current working directory. It must be
   fully self-contained: inline CSS and JS only. No external resources of any kind
   (no CDN scripts, no web fonts, no image URLs, no fetch). Visuals must be made with
   CSS, inline SVG or canvas.
2. Must work with JavaScript disabled (all copy readable, page navigable) and must
   honour `prefers-reduced-motion`.
3. Must be usable at 390 px wide and at 1440 px wide with no horizontal overflow and
   no clipped or overlapping text.
4. Use only the copy above; the CTA can be a non-functional button or a `mailto:`.
5. Do not read, fetch or reference any other files on this machine except what is in
   the current working directory.
