# 11. APC Mini MK1 LED model

## Status
Accepted.

## Context
The Akai APC mini MK1 is a 9×9-ish controller whose LED model differs
from the Launchpad Mini MK3 in three ways:

1. **Limited state set.** Per the Akai documentation and community
   references, the LED is set by Note On with a velocity that selects one
   of seven states:
   `0 = off, 1 = green, 2 = green-blink, 3 = red, 4 = red-blink,
    5 = yellow, 6 = yellow-blink`. Some sources double these values
   (0/2/4/6/8/10/12); Daslight's exports use the single-value form, which
   is what we mirror.
2. **Per-button color constraints.** The bottom row (track buttons,
   notes 64–71) is red-only. The right column (scene launch, notes 82–89)
   is green-only. The shift button (note 98) has no LED.
3. **Mixed status bytes.** Real Daslight files contain both `144` (Note
   On) and `128` (Note Off) on OUT/OUT1/OUT2. The hardware reads velocity
   regardless. We accept both on parse, always emit `144` on encode, and
   preserve the original raw string verbatim if the user did not change a
   given state (see ADR 0004).

## Decision
- Implement the seven LED states in `src/devices/akai-apc-mini/states.js`.
- Encode constraints in the layout (`allowedStateIds` per button).
- The settings panel renders only allowed states for the active selection.

We explicitly **do not** support the APC mini MK2 in this profile. MK2 has
128 RGB colors via a different protocol; it should be its own profile.

## References
- <https://www.qlcplus.org/forum/viewtopic.php?t=16397>
- <https://help.madrix.com/m5/html/madrix/hidd_akai_professional_apcmini.html>

## Consequences
- The picker uses `pickerHint.kind = 'flat'` for APC mini.
- Round-trip round-trips bit-exactly when nothing is touched, even where
  Daslight chose unusual status bytes.
