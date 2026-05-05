# 12. Page-wide animation phase synchronization

## Status
Accepted.

## Context
`<pad-button>` stripes use CSS keyframe animations for `flash` and
`pulse`. Browsers start each animation when the keyframes attach to an
element, so a stripe added or recolored later starts its own timeline at
t=0 and is out of phase with stripes that have been animating since
page load. Visually: half the launchpad blinks, the other half blinks
half a beat later.

## Decision
Snap each animation's `currentTime` to a shared phase computed from a
single monotonic epoch (`performance.now()` at module init). The
synchronizer (`src/lib/anim-sync.js`) is called from
`pad-button.updated()` and runs inside a `requestAnimationFrame` so the
animations have actually started before we read them with
`getAnimations()`.

A global `visibilitychange` listener re-snaps every animation in the
document when the tab becomes visible again, so re-aligning after a
long throttled background sleep is automatic.

We rejected a JS rAF loop driving a CSS variable: it would burn CPU
continuously while any stripe is animated, requires a start/stop
state machine, and gains nothing over snapping once at attach time.

We rejected a pure CSS solution (`animation-delay: -X` from a CSS
variable set at boot): it only works for elements whose animations
start at boot. Stripes attached later jump to the same offset *of their
own timeline*, not the global phase, so they don't actually sync.

## Consequences
- New stripes (state changes, multi-select edits) join the existing
  flash/pulse beat without a flash of misalignment.
- The synchronizer is one tiny module with no per-frame work.
- Adding new animations elsewhere is a localized change: same call
  pattern, optionally a new keyframe with its own duration.

## Out of scope
- `prefers-reduced-motion` — separate concern, future ADR.
- Per-device flash/pulse rates (real LP MK3 hardware blinks at the
  device's tempo, not ours). For now CSS uses fixed durations.
