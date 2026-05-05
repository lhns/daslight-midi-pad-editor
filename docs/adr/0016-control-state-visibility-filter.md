# 16. Control-state visibility filter

## Status
Accepted.

## Context
A `<pad-button>` always renders three horizontal stripes — Off, On,
Fade. With 81 buttons on the grid, that's 243 animated cells, and a
user often only cares about one state at a time (e.g. "what does the
On color look like across the whole pad?"). The settings panel
likewise renders all three accordion sections. We want a quick way to
hide the noise.

## Decision
A small UI filter, three pill buttons positioned top-center above the
pad, toggles which control states are visible. Default = all three.

The state of the filter lives in the global store as
`visibleControlStates: Set<'off'|'on'|'fade'>`, applied **uniformly**
to:

1. `<pad-button>` — renders only the visible stripes via
   `visibleControlStates.map(c => stripe(states[c]))`. CSS-grid row
   count comes from a `--stripe-count` custom property so two stripes
   share 50/50 and a single stripe fills the cell.
2. `<settings-panel>` — filters the `['off','on','fade']` array used
   to render `<details>` sections; iteration order stays canonical.

A single source of truth keeps the two UIs trivially in sync; without
it, a user could hide Off in the panel but still see Off stripes on
the pad.

The toggle action enforces **at least one visible** — the last
toggle-off is a no-op. Rationale: a pad with zero stripes is just a
dark grid where the user can't tell what they're editing. Better to
forbid the dead-end than to surface it.

The filter is **purely visual** and never enters the XML model:

- `loadFile` and `reset` re-initialize the set to `{off, on, fade}`.
- "Copy all" / "Paste all" still touch every slot regardless of
  visibility, because the model carries all three.
- A user editing only the On state via per-section controls (Copy,
  Paste, color, mode) still leaves Off and Fade exactly as they were.

## Consequences
- The filter is a generic UI affordance; adding more states (if a
  future controller has a fourth) is a one-line update to the
  CONTROL_ORDER constants in `launchpad-grid.js` and `settings-panel.js`.
- Not persisted across reloads — that's acceptable for a tool whose
  session is "load file → edit → save".
- The `<launchpad-grid>` host now contains both the filter and the
  grid; the filter is visually part of the board, which is
  intentional (top-center makes it the obvious toggle for what's on
  display).
