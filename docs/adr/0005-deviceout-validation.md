# 5. Validate DEVICEOUT and offer a bulk fix

## Status
Accepted.

## Context
Daslight allows `DEVICEOUT="All"` which sends LED feedback to every MIDI
output, not just the intended one. In real-world XML files this happens
frequently — the example in `docs/example-input.xml` has 24 such entries.
Sending feedback to "All" can confuse other connected controllers.

## Decision
On load, scan all `<SETTINGS>` elements. Any whose `DEVICEOUT` doesn't match
the active profile's expected value but is in `altDeviceOut` (currently just
`"All"`) is flagged as **fixable**. The toolbar shows a banner with a
**"Fix all"** button that rewrites those attributes to the canonical
`DEVICEOUT`.

## Consequences
- Users get a one-click cleanup for the most common Daslight foot-gun.
- Non-fixable mismatches (e.g. wrong device entirely) are still surfaced but
  not auto-changed.

## Update — multi-device fix orients to each row's input port (ADR 0023)
Once XMLs can mix multiple controllers, a single global fix value is
wrong: an APC mini row must not be forced to the LP MK3's
`MIDIOUT2 (LPMiniMK3 MIDI)`. `validate` now scans against every
registered profile and stores a `suggestedDeviceOut` per offender,
derived from the row's `<EVENT DATA>` port suffix. `applyFix` writes
each row's own suggestion. A row whose input port doesn't match any
known profile is flagged but not auto-fixable.
