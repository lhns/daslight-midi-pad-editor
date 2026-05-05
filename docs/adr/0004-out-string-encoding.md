# 4. OUT-string encoding lives in the device profile

## Status
Accepted.

## Context
Daslight stores LED state in three attributes per `<SHORTCUT>`:
`OUT` / `OUT1` / `OUT2`, corresponding to the control states off / on / fade.
The string format is profile-specific:

- **Launchpad Mini MK3** uses `STATUS:CHANNEL:NOTE:COLOR:PORT` with the
  channel byte encoding the LED mode (0 static, 1 flash, 2 pulse) and a
  separate 0..63 color byte.
- **Akai APC mini MK1** uses the same shape on the wire but packs both
  color and mode into the velocity byte (0..6) and uses channel 0 always.
  Additionally, OFF-state strings sometimes appear with status `128`
  (Note Off) instead of `144`.

## Decision
Each device exposes an `OutCodec` with `parse(s, addr) → stateId` and
`encode(stateId, addr, controlState) → string`. The XML layer never
inspects the string itself — it asks the active profile.

Round-trip preservation: when a state is read but never modified, the
**raw attribute value is left untouched** in the DOM (see
`xml/serialize.js`). The encoder is only invoked when the user changes a
value. This protects against small format quirks (e.g. APC mini's
status-128 off-strings) we don't fully understand or care to canonicalize.

Note that bit-exact textual round-trip is **not guaranteed** — the browser
`XMLSerializer` may normalize whitespace, self-closing tags, and other
formatting details. What we guarantee is **structural equivalence**: every
`<SHORTCUT>` keeps its `DEVICEOUT`, `OUT`, `OUT1`, `OUT2` values verbatim
unless the user explicitly changed them. This is sufficient for Daslight
to reload the file.

## Consequences
- Adding a new device's OUT format is a localized change.
- Bit-exact round-trip is guaranteed for unedited buttons.
- Tests assert that `encode` always produces a deterministic canonical form
  per profile, separately from round-trip preservation.
