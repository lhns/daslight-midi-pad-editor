# 10. Device profile interface

## Status
Accepted.

## Context
The same UI must drive at least two controllers (LP Mini MK3, APC mini MK1)
with very different LED models, and ideally accommodate further controllers
in the future. We want extensibility without leaking device-specific
branches into UI code.

## Decision
A `DeviceProfile` is a plain object exporting:

- `id`, `label`, `deviceOut`, `altDeviceOut`, `eventPort`.
- `grid: { rows, cols }` — UI grid dimensions.
- `layout: ButtonAddr[]` — every physical button with its (row, col, kind,
  allowedStateIds, midi).
- `states: LedState[]` — every LED state the device can render
  (id, label, hex, animation).
- `defaultStateId` — used when the user clears a state.
- `pickerHint` — `{ kind: 'orthogonal'|'flat', ... }` so the picker
  component can render the right control without caring which device.
- `outString` — `{ parse, encode }` codec.
- `matchScore(doc) → 0..1` heuristic for auto-detection.

Profiles are imported statically and registered in `src/devices/index.js`.
There is **no plugin loader** — profiles ship with the bundle. Adding a new
device is a normal PR.

UI components consume the active profile via the global store; they must
not branch on `profile.id`.

## Consequences
- Adding a profile is a self-contained change, fully covered by its own
  tests.
- `pickerHint.kind` is the one place where UI behavior conditions on the
  device's information model. This is intentional: orthogonal palettes
  (LP MK3) need a 2D picker, flat palettes (APC mini) don't.
