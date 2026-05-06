# 19. Ctrl+C / Ctrl+V respect the pill filter

## Status
Accepted.

## Context
The settings panel already exposes `Copy all` / `Paste all` and
per-section `Copy` / `Paste` buttons. Keyboard equivalents
(Ctrl/Cmd+C, Ctrl/Cmd+V) were unbound. The visibility filter pills
(ADR 0016) define the user's current focus by hiding control states
they don't care about; an unconditional Ctrl+C copying every slot
would fight that focus.

## Decision
Bind `Ctrl/Cmd+C` and `Ctrl/Cmd+V` on `<app-root>` via a window-level
`keydown` listener. Both honor the pill filter:

- **Ctrl+C** copies the LED state for every visible control state
  from the first bound button in the selection. Hidden slots are not
  written to the clipboard. A clipboard from `{on}`-only visibility
  contains only `on`.
- **Ctrl+V** pastes the intersection of clipboard slots and the
  current visibility set onto every selected bound button. Slots
  that are hidden, or visible-but-empty in the clipboard, are
  skipped.

We considered making the keyboard shortcuts unconditional ("copy
everything") and treating them as a power-user escape hatch. Rejected:
inconsistent with the panel UX (where `Copy all` is the explicit
opt-in to "all" semantics) and would defeat the very mode the user
just set up by hiding pills.

The handler skips any keystroke whose target is a form control
(`<input>`, `<textarea>`, `<select>`, `[contenteditable]`). The app
has no such elements today, but the guard avoids a future-foot-gun.

## Consequences
- The keyboard pair becomes a fast version of the per-section copy:
  user hides everything except `On`, presses Ctrl+C on a source
  button, multi-selects targets, presses Ctrl+V.
- The handler is owned by `<app-root>` and removed in
  `disconnectedCallback` — no leak if the root is ever unmounted in
  a test.
- Tests in `test/components/keyboard.test.js` exercise the listener
  end-to-end via `dispatchEvent(new KeyboardEvent(...))`; per-action
  unit tests in `test/state/actions.test.js` cover the slot-by-slot
  filter behavior.

## Update — Inspector "Copy all" matches Ctrl+C
The top-level Copy button in the settings panel now also calls
`copyVisible()` so click and keyboard share one source of truth. The
button label flips to "Copy selected" whenever the pill filter is
active, hinting that the result will be partial. See ADR 0014 for the
panel-side write-up.
