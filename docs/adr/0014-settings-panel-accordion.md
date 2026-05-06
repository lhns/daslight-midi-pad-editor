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

A small `.axis-label` reading "Mode" sits above the mode buttons in
the side column, mirroring the "Color" label above the color
swatches inside `<color-palette>`. Rendered only when
`profile.modeAxis.length > 1` (no label when there's nothing to
choose between).

## Update — pinned panel min-width
The host previously declared `width: 360px; max-width: 40vw`. Between
the mobile breakpoint (700 px) and 900 px (where `40vw` reaches
360 px) the cap won and the panel shrank to 280–360 px. The picker-row
flex then squeezed `.side-col`, whose buttons (`white-space: nowrap`)
overflowed their text.

The host now pins to `width: 384px; min-width: 384px` (no max-width
cap). The number is the sum of the panel's intrinsic content widths:

```
swatch-grid       8 × 26 + 7 × 4   = 236
picker-row gap                       8
side-col content (widest button)   ~80   // ~5-char label + 24 px padding + 2 px border
body padding      0.75rem each      24
details border    1 px each          2
host padding      1rem each         32
                                  ----
                                   382  → 384 (rounded to a multiple of 8)
```

If the swatch count, the longest mode/copy/paste label, or any of the
paddings change, this number must be recomputed in the host CSS
comment.

The mobile breakpoint also moved from 700 → 760 px so the shell
collapses to "panel under pad" before the desktop layout would have
to fit the 384 px panel into a viewport that leaves only ~316 px for
the pad. `<app-root>`, `<settings-panel>`, and `style.css` use the
same threshold.

Defense in depth: `.side-col button { min-width: max-content; flex:
0 0 auto }` so that buttons keep their text-natural width even if
this panel is ever embedded into an unexpected parent.

Two new tests in `test/components/settings-panel.test.js` mount the
panel inside a deliberately too-narrow container and assert
`offsetWidth >= 384` and `scrollWidth ≤ clientWidth + 1` for every
side-col button.

## Update — per-section Paste fallback (ADR 0026)
The per-section Paste button now uses `resolvePasteSlot` to find a
source: `clipboard[ctrl]` first, then the most recent single-slot
copy (`clipboardLastSlot`), then the canonical 'on' → 'off' → 'fade'
order as a defensive backstop. The button is enabled whenever the
resolver finds anything; its `title` attribute reads "Paste from
<Source>" when the resolved slot differs from the section's own slot
— so the user sees the source on hover before clicking. Within-button
cross-state copy (Off → On in the same button) works in the obvious
two-click sequence: Copy in Off, Paste in On.

`pasteAll` and `pasteVisible` are intentionally *not* on the resolver
— they remain bulk paste operations that copy each populated
clipboard slot into its matching target slot only.

## Update — top-level Copy button honors the pill filter
"Copy all" now calls `copyVisible()` (the same action Ctrl+C uses)
instead of `copyAll(addrId)`, so the pill filter applies the same way
on click as on keyboard. The label switches to "Copy selected" when
fewer than three pills are visible — a visible cue that the user is
about to copy a partial set. With all three pills active the behavior
is identical to before (clipboard receives all three slots).
