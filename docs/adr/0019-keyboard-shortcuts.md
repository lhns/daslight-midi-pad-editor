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

## Update — Help dialog surfaces every shortcut
The toolbar now carries a small round `?` button at the right edge,
always visible (even before a file is loaded — Help must be reachable
from the empty state). Clicking opens `<help-dialog>`, a native
`<dialog>` element shown via `showModal()`. The browser handles the
top-layer, the focus trap, and Esc-to-close; backdrop-click to close
is wired manually (a click whose target IS the dialog itself, rather
than a child, is treated as a backdrop click).

The dialog content lists every shortcut documented in this ADR plus
those from 0023 (selection rectangle) and 0026 (paste fallback),
grouped by purpose: Selection, Edit, Copy & paste, History, File.
Mac and Windows / Linux modifiers are shown together (`Ctrl / ⌘`)
to avoid platform detection. The `<help-dialog>` lives in
`src/components/help-dialog.js`; toolbar embeds it as a Lit child.

Layout: `dialog` is `display: flex; flex-direction: column`. The body
is `flex: 1 1 auto; min-height: 0; overflow-y: auto`, so it always
takes exactly the remaining space inside the dialog and scrolls
internally — no magic-number subtraction of an estimated head height,
which previously could clip the bottom of the content when the head
rendered slightly taller than expected.

## Update — Ctrl+V never falls back across slots (ADR 0026)
Per-section Paste in the inspector uses a resolver that falls back
across slots when the target's own slot is empty. `pasteVisible`
(Ctrl+V) deliberately does **not** — it remains a bulk operation that
writes each populated clipboard slot into its matching pill-visible
target slot. If a user wants cross-state paste, the per-section
button is the right surface.

## Update — Undo / Redo (ADR 0025)
The same `handleKeyShortcut` function in `app.js` adds three
bindings: `Ctrl/Cmd+Z` → `undo()`, `Ctrl/Cmd+Y` → `redo()`,
`Ctrl/Cmd+Shift+Z` → `redo()`. The Shift branch is checked first so
Ctrl+Shift+Z isn't swallowed by the plain-Z branch. Same form-control
skip applies. ADR 0025 covers the per-profile snapshot history that
backs these shortcuts.
