# Effects lab

From the repository root, run `python3 -m http.server 8765`, then open
http://localhost:8765/examples/effects-lab/. The generated `index.html` is a
single-file build. Edit `page.template`, `lab.css`, `lab.mjs` or the shared
runtime, then run `npm run build:lab` from the root. `npm run check:lab` detects
drift. The editable module version must be served rather than opened via file://.

For one HTML file: `npm install`, then
`node tools/export-standalone.mjs examples/effects-lab/page.template --out /tmp/cinematic-lab.html`.
The Google Fonts request remains optional and external; local fallback fonts
keep the composition usable offline. All scene graphics are procedural and MIT.

The six text cards, two proximity studies and four shader fields use the shared
`runtime/`. Pause restores the static page; the quality control sets a cap.
Without JS or WebGL, copy, links and authored gradient posters remain usable.
React equivalents live in the Next template at `/effects-lab`.
