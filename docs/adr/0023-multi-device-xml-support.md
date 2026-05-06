# 23. Multi-device XML support

## Status
Accepted.

## Context
Daslight project files can contain `<SHORTCUT>` entries for multiple
MIDI controllers in a single XML — `docs/midi-all-with-faders.xml`
is the canonical example, mixing 36 Launchpad Mini MK3 buttons with
90 Akai APC mini entries (including 9 fader CC events). The
single-profile assumption baked into the first cut of the editor
hid one of the two devices completely from the UI even though both
sets of edits would round-trip on save. We also can't run the
DEVICEOUT="All" fix correctly: the right canonical value depends on
each row's input device.

## Decision

### Detection: every profile present
`detectAllProfiles(doc)` scans `PROFILES` and returns every profile
whose `matchScore(doc) > 0`. The current `matchScore` is binary
(1 when the profile's port/device strings appear in the file, else 0),
so `> 0` is a clean "is the device referenced" check. `detectProfile`
remains for callers that want a single best match.

### Per-profile model partition
`buildModel(doc, profile)` adds a port-suffix filter: a SHORTCUT only
binds to a profile's layout entry if its `<EVENT DATA>` ends with
`profile.eventPort`. LP MK3 and APC mini share overlapping note
ranges, so without the port filter a row could match both layouts
incorrectly. With the filter each profile's model contains only the
SHORTCUTs that physically belong to that device.

### Per-profile views in the store
The store grows from a single set of slots (`model`, `selection`,
`clipboard`, `selectionAnchor`, `visibleControlStates`) into a
`views: Map<profileId, ViewSnapshot>` plus a mirror of the active
view's slots at the top level. Every component continues to read
`state.model` / `state.selection` etc. without knowing about views;
the only code that touches the map is `loadFile` (seed one view per
detected profile) and `switchActiveProfile(id)` (snapshot the
outgoing top-level into the map, hydrate the incoming view's
snapshot back to the top level). This keeps tab switches cheap and
preserves each tab's selection/clipboard/visibility independently.

### Tabs in the toolbar
When `detectedProfiles.length > 1`, `<app-toolbar>` renders one
`role="tab"` pill per profile. Click → `switchActiveProfile(id)`.
Below the threshold (zero or one), the existing single-device label
shows. Pills use the shared `buttonStyles` `aria-pressed=true`
variant for consistency with the visibility pills above the pad.

### Per-row DEVICEOUT validation/fix
`validate(doc, profiles)` (signature changed to accept either an
array or a single profile, for back-compat) iterates every
`<SETTINGS>` and:

1. Treats DEVICEOUT values matching any profile's `deviceOut` as
   already-canonical.
2. Treats values in any profile's `altDeviceOut` ("All") as
   `fixable: true` if the row's `<EVENT DATA>` port suffix matches
   exactly one profile's `eventPort`. The right `deviceOut` for that
   row is stored on the offender as `suggestedDeviceOut`.
3. Anything else is `fixable: false`.

`applyFix(result)` rewrites each fixable offender to its own
`suggestedDeviceOut`. A mixed file ends up with each row carrying
the correct canonical value for its device.

### Faders / non-button SHORTCUTs survive untouched
APC mini track faders (CC 176 notes 48–56) and any other SHORTCUT
that doesn't match a profile's layout entry are silently skipped by
`buildModel` and never written by `applyModelToDom`. Their original
DOM nodes survive `serialize()` verbatim. A fader-roundtrip test in
`test/xml/parse-serialize.test.js` snapshots the fader EVENT,
ACTION, and SETTINGS attributes pre/post and asserts equality.

## Consequences
- Adding a third device profile is now self-supporting: register it
  in `PROFILES`, give it a unique `eventPort` and `deviceOut`, and
  `detectAllProfiles` plus the per-row fix automatically include it.
- The per-profile view machinery is invisible to components — the
  cost is paid once in `loadFile` and `switchActiveProfile`. No
  component needs to know about tabs.
- Memory: per-tab models are full button maps. For two devices on a
  9×9 layout that's <200 entries — negligible.
- The toolbar's banner text changed from "X entries have DEVICEOUT
  =\"All\" instead of \"<deviceOut>\"" to a device-agnostic phrasing
  because the fix now goes to *each row's* canonical value.
