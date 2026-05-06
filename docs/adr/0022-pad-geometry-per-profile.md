# 22. Per-profile pad geometry: gridTemplate + button shape

## Status
Accepted.

## Context
The first cut rendered every device on a uniform 9×9 grid of identical
square cells, with a `kind: 'grid' | 'round'` flag toggling between
square and circular border-radius. That's fine for the Launchpad Mini
MK3 (which actually is a uniform grid of square pads), but the APC
mini's clip grid is horizontally elongated and its shift button is a
square sitting next to round track and scene buttons. The uniform-cell
model couldn't represent that.

## Decision
Two orthogonal axes of geometry, both profile-driven:

### 1. `profile.gridTemplate`

Optional. Per-column and per-row size multipliers relative to
`--pad-size`. APC mini sets `columns: [1.5×8, 1]` so the eight clip
columns are 1.5× the right-most column's width, while the right
column stays square-cell-sized for the round scene/shift buttons.
Omitted on LP MK3 → all cells `1×`.

`<launchpad-grid>` builds `grid-template-columns/rows` from this:

```js
const colMults = profile.gridTemplate?.columns ?? new Array(cols).fill(1);
const cellSize = (m) => `calc(var(--pad-size, 48px) * ${m})`;
style.gridTemplateColumns = colMults.map(cellSize).join(' ');
```

### 2. `addr.shape`

One of `'rect' | 'circle' | 'square'` per layout entry. Default
mapping from `kind`: `grid → rect`, `round → circle`. Layouts can
override; APC mini's shift button at `(1,9)` overrides to `'square'`
because the hardware shift button isn't round on this device.

`<pad-button>` reflects `shape` as an attribute and the host CSS
matches via `:host([shape="circle"])` etc.:

- `rect` — `.stripes` fills `100% × 100%` of the host (which fills
  its grid cell). On wider cells this is a wide rectangle.
- `circle` — `.stripes` gets `aspect-ratio: 1; width: auto; height:
  100%; max-width: 100%; border-radius: 50%`. The visible button is
  a circle fit to the smaller cell dimension, centered (the host
  uses `place-items: center`).
- `square` — same fit logic as `circle`, no border-radius.

The host itself drops its own border / background / fixed size; those
move onto `.stripes` so the bordered visual matches the shape rather
than the cell.

### Why split the two

Cell sizing is a layout-level property (the right column is narrower
because the round buttons need square cells to look round). Button
shape is a per-button rendering property (the shift button is a
different physical shape from its neighbors regardless of cell size).
Trying to roll both into one field would fight every time a layout
needed nuance.

`kind` is kept on `ButtonAddr` for backwards compatibility with
existing tests; `shape` is the render-time truth.

## Consequences
- LP MK3 keeps its existing look: no `gridTemplate`, every shape
  derived from `kind`.
- APC mini now renders as the user expects: wide clip cells, round
  track/scene buttons, square shift in the bottom-right corner.
- Future profiles can mix shapes freely. A pad with one big jog wheel
  in the middle could declare `shape: 'circle'` on a multi-cell-spanned
  entry (the model would need a span field, but the rendering core
  already handles non-square cells).
- The cell-size CSS var (`--pad-size`) is still the single knob the
  user can tune for visual scale; the per-cell multipliers compose on
  top.
