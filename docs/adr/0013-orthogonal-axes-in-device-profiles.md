# 13. Orthogonal axes in device profiles

## Status
Accepted. Supersedes the `pickerHint.kind` distinction introduced in
ADR 0010.

## Context
The first cut of `DeviceProfile` exposed `states[]` as a flat list and a
`pickerHint.kind` of `'flat'` or `'orthogonal'` to tell the picker
whether to render a 2D grid (LP MK3: color × mode) or a single row of
swatches (APC mini: 7 raw states). This was technically correct but UX
was inconsistent: users editing the APC mini saw `green-blink` /
`red-blink` as opaque swatches with no obvious "this is the same color
as Green, just blinking" relationship.

## Decision
All profiles now expose:

- `colorAxis: ColorAxisEntry[]` — user-facing colors (id, label, hex).
- `modeAxis: ModeAxisEntry[]` — user-facing modes (id, label, animation).
- `compose(colorId, modeId, addr) → stateId` — maps the two axes to an
  internal state id.
- `decompose(stateId) → { colorId, modeId }` — splits back.
- `defaultColorId`, `defaultModeId` — fallbacks when a slot is unset.
- `allowedColorIds: string[]` per `ButtonAddr` — replaces
  `allowedStateIds`; modes are universal unless a future device needs
  per-button mode constraints.

The `<color-palette>` component renders one path: colors row + modes
below. There is no longer a `flat` vs `orthogonal` branch.

For the APC mini, `compose` is a small lookup table mapping
(off|green|red|yellow) × (static|flash) to one of seven internal LED
states; `off` collapses both modes to the single `off` state. For LP
MK3 it is `'lp:<colorIndex>:<modeId>'` string-building, exactly as
before — the underlying state space is unchanged.

## Consequences
- Adding a controller is more uniform: define `colorAxis`, `modeAxis`,
  `compose`, `decompose`, `outString`. No picker logic to author.
- Future devices with extra axes (e.g. APC mini MK2 with 128 RGB +
  brightness) extend `colorAxis`; the picker grows naturally without a
  rewrite.
- Per-button constraints stay as `allowedColorIds`. If a future device
  needs mode constraints too, add `allowedModeIds` symmetrically — the
  edit pipeline already iterates per-axis (ADR 0015).
