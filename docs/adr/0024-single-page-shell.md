# 24. Single-page shell — toolbar and pad area always visible

## Status
Accepted.

## Context
The first cut of `<app-root>` rendered two completely different
layouts depending on whether a file was loaded:

- **No file:** a centered `<drop-zone>` component, big dashed
  rectangle, with a "Choose file…" button — no toolbar visible.
- **File loaded:** toolbar + pad + sidebar.

Re-using the toolbar's controls (Download, the active-device tabs)
required a file. The "Open another…" reset action threw the user back
to the empty-state layout, which felt like navigating to a different
page. There was no way to drop a *replacement* file on the pad area
either — only on the empty-state view.

## Decision
One shell. `<app-toolbar>` and `<main>` always render. The pad area
holds either `<launchpad-grid>` (file loaded) or a smaller centered
"Drop a Daslight XML file here" placeholder (no file). The pad area
itself owns the drag/drop handlers, so dropping a file works in both
states (replacing the loaded one, if any). The settings panel renders
only when a file is loaded; on the empty state `<main>` collapses to
a single column via a `solo` modifier.

The toolbar:

- Left button is **"Open file"** (formerly "Open another…"). It
  triggers a hidden `<input type="file">`. No reset step — picking a
  new file just calls `loadFile`, which replaces the state. We
  removed the reset action call from this button entirely.
- **Download XML** uses `?disabled=${!state.document}` so it greys
  out when there's nothing to download.
- The active-device label / device tabs / filename render only when
  a document is loaded.

A new `state.loadError` slot captures any error from `loadFile` and
the placeholder renders it under the drop hint, in the danger color.
On the next successful load the slot clears.

## Consequences
- One layout, fewer mental states. Toolbar buttons stay where the
  user expects them across drops.
- `<drop-zone>` has no callers and was deleted.
- The empty state's drop area is smaller than the previous full-page
  zone, but the entire pad-area accepts drops, so the *target* size
  is similar in practice.
- A drag visually highlights the pad area regardless of whether a
  file is currently loaded.
- Tests for the empty / loaded shells live in
  `test/components/app-root.test.js`; toolbar enable/disable +
  picker wiring lives in `test/components/toolbar.test.js`.
