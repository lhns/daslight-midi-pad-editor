# Claude operational notes

## What this project is
Browser app (Lit + import maps, no dev bundler) to edit Daslight XML files
controlling MIDI pad LED appearance. Two device profiles ship from day one:
Launchpad Mini MK3 and Akai APC Mini MK1. See `README.md` for the full
project layout.

## Commands
- `npm run dev` — start `@web/dev-server` on `localhost:8000`.
- `npm test` — Web Test Runner (headless Chromium) + `@open-wc/testing`.
- `npm run build` — produces a single self-contained `dist/daslight-midi-pad-editor.html`.

## Architecture rules
- **Device profiles are the extension axis.** Anything controller-specific
  (layout, LED state model, OUT-string codec, port names) lives under
  `src/devices/<device>/`. UI components must not branch on device id —
  they consume the active profile via Lit context.
- **OUT-string codec is per-profile.** LP MK3 separates color (byte 4) from
  mode (channel byte). APC mini packs mode + color into the velocity byte
  and uses status `128` for off-state and `144` for on/fade. Don't assume a
  shared format.
- **DOM-based pad rendering**, not canvas. CSS animations for flash/pulse.
- **No build step in dev.** esbuild only runs for `npm run build`.
- **Preserve XML faithfully.** Parse with `DOMParser`, mutate only the
  attributes we own (`OUT`/`OUT1`/`OUT2`/`DEVICEOUT`), serialize back. Don't
  reorder attributes or reformat the document.

## Pointers
- Original task: `docs/task.txt`.
- LED format notes: `docs/infos.txt`.
- Architecture decisions: `docs/adr/`.
