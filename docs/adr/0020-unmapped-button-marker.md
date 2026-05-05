# 20. Unmapped buttons get a red crossed-circle marker

## Status
Accepted.

## Context
Buttons whose layout entry has no corresponding `<SHORTCUT>` in the
loaded XML are flagged `bound = false`. They are still selectable
(ADR-related fix in commit `d624d97`) so the user can see them and the
inspector banner explains why edits don't apply. The visual cue,
though, was just `opacity: 0.35` on the host. That reads as "darker
button" rather than "this button isn't mapped."

## Decision
Render an inline SVG over `<pad-button>` when `bound === false`:

```svg
<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="9" fill="none" stroke="#ef4444" stroke-width="2.5"/>
  <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" stroke="#ef4444" stroke-width="2.5"/>
</svg>
```

Positioned absolute, `inset: 15%`, `pointer-events: none`,
`drop-shadow(0 0 2px rgba(0,0,0,0.7))` for legibility against any
stripe color underneath. Pointer-events: none keeps the host
clickable, so selection still works and the inspector banner appears
on click.

The dim is softened from `0.35` to `0.65` — the icon now carries the
state, and a heavy dim made it hard to read.

## Consequences
- The state "not mapped to a Daslight scene" is unmistakable on the
  pad without needing the inspector banner first.
- A red icon over an animating stripe keeps its readability thanks to
  the drop-shadow; nothing pulses through it.
- We rejected a tooltip ("Hover to see why") because the inspector
  banner already explains the constraint when the user clicks, and a
  tooltip would only surface on hover, hurting discoverability.

## Tests
`test/components/pad-button.test.js` asserts the SVG is rendered when
`bound=false` and absent when `bound=true`, with `aria-hidden="true"`
so screen readers ignore it (the inspector banner is the
spoken-channel surface for the same information).
