# 21. Hardware-accurate flash/pulse animation

## Status
Accepted.

## Context
Until now, `<pad-button>` animated flash/pulse stripes by oscillating
their opacity (`@keyframes flash { 0%, 49% { opacity: 1 } 50%, 100% {
opacity: 0.1 } }`). This produced a "color blinks against the host
background" preview that was the same on every device — convenient,
but wrong.

Each device renders flash/pulse differently:

- **Launchpad Mini MK3.** A flashing or pulsing on/fade LED toggles
  between its color and the **static off-state color of the same
  button**, not against black. So if Off is set to red and On is set
  to green-pulse, the LED actually pulses green↔red. **Edge case:** if
  Off itself flashes/pulses, the hardware can't run two animations on
  one LED, and on/fade fall back to color↔black. The off stripe
  itself always animates against black because there's no lower
  reference.
- **Akai APC mini MK1.** Flash is not an animation mode but a separate
  velocity (`green-blink`, `red-blink`, …). The LED always toggles
  between its color and 0. There is no pulse mode; the user-facing
  `modeAxis` only exposes static and flash for this profile.

Without this nuance, the preview misleads — a user trying to set up
"On=green-pulse against a red base" sees green-pulse against black and
can't tell whether the off color is contributing.

## Decision
Each profile declares a `flashStrategy: 'off-state' | 'black'`
property:

- LP MK3: `'off-state'`.
- APC mini: `'black'`.

`<pad-button>` reads it via a property and the launchpad-grid passes
`profile.flashStrategy` along. Stripes animate `background` between
two CSS custom properties:

```css
.stripe { background: var(--stripe-color, transparent); }
@keyframes flash {
  0%, 49%   { background: var(--stripe-color); }
  50%, 100% { background: var(--alt-color); }
}
@keyframes pulse {
  0%, 100% { background: var(--stripe-color); }
  50%      { background: var(--alt-color); }
}
```

A small helper resolves the alt color per control state:

```js
function altColor(ctrl, states, strategy) {
  if (strategy === 'black') return '#000';
  if (ctrl === 'off') return '#000';
  const off = states.off;
  if (!off) return '#000';
  if (off.animation !== 'static') return '#000';
  return off.hex;
}
```

### Alternatives considered

- **Multiple stacked `<div>` layers** with fixed colors and an
  opacity-animated overlay. More DOM, more work to keep
  `anim-sync.js` in lockstep, no benefit over swapping a CSS variable.
- **JS-driven frame updates** via `requestAnimationFrame`. Possible
  but unnecessary — CSS keyframes against custom properties give the
  same result with the browser's built-in scheduling.
- **Per-device renderer** that owns the stripe markup. Wrong axis of
  extension: device-specific knowledge belongs in the profile
  (ADR 0010, 0013), not in a forked component.

## Consequences
- The preview now shows what the user will see on hardware.
- A future device with a different flash semantic (e.g. "flash against
  the device's ambient backlight") gets a new `flashStrategy` value
  without touching the component.
- `anim-sync.js` keeps working because the animations still use the
  `.flash` and `.pulse` class names; only the keyframes' targets
  changed (background instead of opacity).
- The flash drift tolerance in the anim-sync test was raised slightly
  (20ms → 40ms) because background-color keyframes incur an extra
  scheduling step compared to the simpler opacity animations they
  replace; 40ms is still well under the human-perceptible threshold.
