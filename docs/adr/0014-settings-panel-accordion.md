# 14. Accordion-style settings panel with per-mode copy/paste

## Status
Accepted. Replaces the pill-switcher for off/on/fade introduced in the
initial implementation.

## Context
The original settings panel had a single-line pill switcher
(Off / On / Fade) at the top and below it one editable section for the
currently selected control state. To compare values across the three
states, the user had to click each pill in turn. Per-state copy/paste
was unavailable — only "Copy" (whole button) and "Paste".

## Decision
Three native `<details>/<summary>` accordion sections — one per control
state. Each section contains the same `<color-palette>` plus its own
**Copy <ControlState>** and **Paste <ControlState>** buttons. Above the
accordions sit "Copy all" / "Paste all", which behave like the original
copy/paste did.

The clipboard model becomes partial: `{ off?, on?, fade? }`. Slots are
independent — copying just "On" leaves the other two slots empty, and
"Paste Off" stays disabled until a slot for Off has been copied.

Why not a tabbed inspector?

- Tabs hide the other two states. The whole point of the panel is to
  reason about all three at once.
- Native `<details>` is keyboard-accessible, screen-reader friendly,
  zero JS, and matches users' expectations on both desktop and mobile.

Why per-mode copy/paste?

- A common workflow is "make On glow red on this whole row". Copying
  just the On state from one button and pasting it across a selection
  is a one-line operation; the previous panel forced you to copy the
  whole button (off+on+fade), which would also overwrite Off and Fade
  on the targets.

## Consequences
- More buttons in the panel, but each section's actions are scoped, so
  the screen weight is similar to the old layout.
- The mode selector now lives below the color picker (instead of
  beside it) — the panel is narrower.
- Backwards-compat aliases `copyFromButton` and `pasteToSelection` are
  kept temporarily; they delegate to `copyAll` and `pasteAll`.

## Update — control-state visibility filter (ADR 0016)
Sections are no longer hard-wired to all three control states. The
panel filters them through the global `visibleControlStates` set so
the user can hide the ones they're not editing. Iteration order stays
canonical (Off → On → Fade) and per-section copy/paste keeps working
on the visible sections only. "Copy all" / "Paste all" still operate
on all three slots regardless of filter — the model carries the full
state.

## Update — per-section button labels
The labels inside each accordion are plain "Copy" / "Paste" instead of
"Copy Off" / "Paste Off". The accordion summary already announces
which control state is being edited, and the top-level "Copy all" /
"Paste all" carry the distinguishing word.

## Update — picker-row layout
Each accordion body now lays out as `.picker-row` (flex): the
`<color-palette>` (colors only) on the left, a vertical `.side-col`
on the right. The side column carries the profile's mode buttons
(when more than one mode exists), a thin divider, and the per-section
Copy / Paste buttons.

The mode selector used to sit *under* the color grid inside
`<color-palette>` and Copy/Paste sat in their own row below. Stacked
vertically that's three rows of content per section; with three
sections open in a 64-swatch profile (LP MK3) the panel ran past
1000 px tall. The 2-column layout collapses two of those rows into
one, dropping ~80 px per section while keeping mode and actions
discoverable next to the colors.

Paste / Paste-all also dropped the trailing `(empty)` suffix — the
disabled style is the visible source of truth.
