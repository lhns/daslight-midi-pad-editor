# 10. Device profile interface

## Status
Accepted. Updated by ADR 0013 — `pickerHint`/`states` selector replaced
by `colorAxis` × `modeAxis` + `compose`/`decompose`; `allowedStateIds`
replaced by `allowedColorIds`. Updated by ADR 0022 — optional
`gridTemplate` and per-button `shape` for non-uniform pad geometry.

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
  `allowedColorIds`, midi).
- `states: LedState[]` — every internal LED state the device can render
  (id, label, hex, animation). Used by the OUT codec and renderer.
- `colorAxis`, `modeAxis`, `compose(colorId, modeId, addr)`,
  `decompose(stateId)` — orthogonal user-facing axes plus the codec
  that maps them to internal `states` (see ADR 0013).
- `defaultStateId`, `defaultColorId`, `defaultModeId` — fallbacks used
  when a slot is unset.
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
- The picker no longer branches on profile id or shape: every profile
  has a `colorAxis` and a `modeAxis`. Profiles with a single mode
  (`modeAxis.length === 1`) hide the mode selector automatically.
