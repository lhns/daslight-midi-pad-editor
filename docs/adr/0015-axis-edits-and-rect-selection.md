# 15. Per-axis edits and shift-click rectangle selection

## Status
Accepted.

## Context
Two related interaction defects in the first version of the editor:

1. **Mode change overwrote color in mixed selections.** The picker
   composed a complete state id from its own `(color, mode)` view and
   sent it through `applyToSelection`. When the selection had buttons
   of mixed colors, the picker had no shared color to fall back on, so
   it defaulted to color index 0 (black). Clicking only "Flash" then
   silently turned every selected button black.

2. **No 2D range selection.** Multi-select was only Shift-toggle (one
   button at a time). For a 9×9 pad the typical task is "make this
   whole column red" — that needs a rectangle.

## Decision

### Per-axis edits
The picker emits **two separate events**: `color-pick` with
`{ colorId }` and `mode-pick` with `{ modeId }`. The settings panel
calls `setAxisOnSelection(controlState, 'color' | 'mode', value)`. The
action iterates the selection and, **per button**:

1. Reads the current state id (or `defaultStateId`).
2. `decompose` → `{ colorId, modeId }`.
3. Overrides the one axis the user changed.
4. Skips the button if the resulting color is not in
   `allowedColorIds` (constraint break is dropped silently rather than
   forced).
5. `compose` → new state id, marked dirty.

`applyStateToSelection` (full state-id overwrite) survives as the paste
path — paste explicitly wants to copy both axes from a clipboard slot.

### Shift = rectangle, Ctrl/Cmd = toggle
`selectionModeFromEvent` now distinguishes Shift (`'range-rect'`) from
Ctrl/Cmd (`'toggle'`). Plain click is `'replace'`. The store gains a
`selectionAnchor` slot — the last button that was plain-clicked or
Ctrl-clicked. Shift-click computes the inclusive bounding rectangle
between anchor and target via `rectIds(anchorId, targetId)` and unions
it with the current selection. The anchor itself does **not** move on
shift-click, so the user can keep dragging out the rectangle from a
fixed corner.

We deliberately did not implement spreadsheet-style row-wrapping range
(where Shift would select all buttons "between" two ids in reading
order) because the pad is a 2D surface where the typical pattern is
"highlight a column" or "highlight a 4×4 block", not "from cell 23 to
cell 47 in reading order".

## Consequences
- Mixed-color edits now do exactly what users expect: mode change
  preserves color, color change preserves mode.
- Range selection is one shift-click. A user can color a whole column:
  click the top, shift-click the bottom, set color.
- `allowedColorIds` is enforced at the action layer, not just at the
  picker — pastes and rectangle edits both respect per-button
  constraints.
- The grid component is now thin: it maps a click event to a mode and
  calls a single `selectFromClick` action. All multi-select rules live
  in `lib/selection.js` and `state/actions.js`.
