# 25. Undo / redo via per-profile state-snapshot history

## Status
Accepted.

## Context
Editor-baseline expectation: Ctrl+Z reverses the last edit; Ctrl+Y
(or Ctrl+Shift+Z) replays it. The first cuts of the editor had no
history at all — every color/mode pick, paste, or fix was final.
A misclick in the middle of programming a launchpad was painful.

## Decision

### Scope: model edits only
The undo stack covers actions that mutate per-button LED state:

- `setAxisOnSelection` — color / mode picks from the picker.
- `applyStateToSelection` (alias `applyToSelection`) — paste-all
  with a fully-formed state id.
- `pasteAll` — paste every populated clipboard slot.
- `pasteMode` — paste a single slot.
- `pasteVisible` — keyboard paste filtered by pills (inlined; one
  history step regardless of how many slots it writes).

Out of scope, by design:

- View state (selection, pill filters, tab switches). Undoing a
  selection click is irritating in editors — users routinely click
  to inspect, and would not expect Ctrl+Z to walk back through
  those.
- File load / reset (replaces the whole model — undo would have
  to bring back the previous file from somewhere; users can
  re-open the file).
- `fixDeviceOut` (DOM-only mutation; our snapshot captures
  `model.buttons[*].states`, not DOM attributes). Documented as a
  one-shot operation; if a user wants to revert it they reload the
  file. Could be added later if a real workflow demands it.
- Copy operations (clipboard isn't an edit).

### Storage: state-snapshots over inverse commands

Each undoable action calls `pushHistory()` *before* mutating, which
clones the current `model.buttons[*].states` and pushes it onto the
past stack:

```js
Map<addrId, { off: Slot|null, on: Slot|null, fade: Slot|null }>
```

`undo()` pops the past stack, captures the *current* state into
the future stack, and restores. `redo()` is the mirror.

Cap: `HISTORY_MAX = 100` past entries; the oldest is dropped when
exceeded. Memory bound: 100 × ~80 button × 3 small slot objects =
small.

We chose snapshots over inverse commands because:

- Each new mutating action becomes undoable just by adding one
  `pushHistory()` line — no per-action inverse logic.
- Restoration is a deterministic write of the snapshot; nothing to
  go wrong with action ordering.
- Memory cost at 100 steps is unmeasurable in practice.

### Per-profile isolation

`history` is part of `VIEW_KEYS` (alongside `model`, `selection`,
`clipboard`, etc.). `switchActiveProfile` already snapshots and
restores every key in that list, so each tab in a multi-device file
has its own past/future. Ctrl+Z on the active tab undoes that tab's
last edit; switching tabs reveals the other tab's intact history.

### Keyboard

In `app.js`'s `handleKeyShortcut`:

- `Ctrl/Cmd+Z` (without Shift) → `undo()`
- `Ctrl/Cmd+Shift+Z` → `redo()`
- `Ctrl/Cmd+Y` → `redo()` (Windows convention)

The Shift branch comes first so Ctrl+Shift+Z isn't swallowed by the
plain-Z branch.

## Consequences
- The user's mental model — Ctrl+Z reverses the last visible
  change — works for all picker/paste actions.
- The `pasteVisible` action was inlined (it used to call `pasteMode`
  in a loop) so a single Ctrl+V is one undo step, not three.
- Tab-switching doesn't lose history per tab.
- No toolbar UI for undo/redo in this iteration; keyboard is the
  primary surface. Adding visible buttons later is an additive change
  (the actions and state already exist).
