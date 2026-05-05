# 17. Sidebar scrolls; the board never resizes from panel content

## Status
Accepted. **Updated** — the first cut was incomplete; the final fix
hard-caps the layout to the viewport on desktop.

## Context
The settings panel has three accordion sections (one per control
state, each with a 64-swatch picker) plus copy/paste buttons. Open all
three on a moderate-height window and the panel's natural content
height exceeds the viewport. The first cut had `overflow: auto` on the
panel host but no constrained height — the host grew to fit, the
`<main>` grid's `auto` column expanded, and the `1fr` pad column
shrank to compensate. Net effect: opening the panel made the pad get
smaller, which is jarring.

## Decision
**Layout invariant:** the pad's geometry depends on viewport size only.
Panel content never affects pad dimensions. The panel scrolls
internally instead of expanding its container.

Concretely, on desktop:

- `<main>` claims `height: 100%; min-height: 0; overflow: hidden` so
  its grid columns fit the available height instead of computing a
  larger height from intrinsic content.
- `<settings-panel>`'s host claims `height: 100%; max-height: 100%;
  min-height: 0; overflow-y: auto`. With the parent constrained, the
  host scroll-container kicks in.
- `.pad-area` claims `min-width: 0; min-height: 0` so the `1fr` pad
  column doesn't get pushed by the pad's intrinsic content size.

On mobile (`max-width: 700px`), the invariant flips: the page itself
scrolls, the panel sits below the pad with `height: auto;
max-height: none; overflow-y: visible`, and `<main>` switches to
`overflow: visible; height: auto`. There's no fight between an
internal panel scroll and a page scroll on small screens — the entire
page is the scroll context.

## Consequences
- Adding more accordions or longer content does not affect the board.
- A small-window user gets a scrollable inspector instead of a
  flexed-down pad.
- The mobile path needs no special height math; it's just a stacked
  vertical layout.
- The CSS pattern (constrain ancestors with `min-height: 0`,
  put `overflow-y: auto` on the leaf that should scroll) is reusable
  for any future right-side overlay.

## Update — full fix

The above was insufficient. `<app-root>` declared `min-height: 100vh`
(not `height`), and `<body>` had `min-height: 100vh` with no overflow
lock. With panel content taller than the viewport, the host grew past
100vh, the `1fr` row in `<main>` grew with it, the page itself
gained a scrollbar, and `<settings-panel>`'s internal `overflow-y:
auto` never engaged because its ancestor was no longer bounded.

Final layout chain (desktop):

```
<html>, <body> { height: 100%; overflow: hidden; }   /* style.css */
<app-root> :host {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100dvh;                                    /* hard cap */
  min-height: 0;
  overflow: hidden;
}
<main> { display: grid; grid-template-columns: 1fr auto;
         min-height: 0; height: 100%; overflow: hidden; }
.pad-area { overflow: auto; min-width: 0; min-height: 0; }
<settings-panel> :host { height: 100%; max-height: 100%;
                          min-height: 0; overflow-y: auto; }
```

On mobile (`max-width: 700px`), every layer releases the lock:
`html`/`body` use `overflow: auto`, the host uses `min-height:
100dvh; height: auto`, and `<main>` switches to `overflow: visible;
height: auto`. The page becomes the scroll context and the panel
grows naturally below the pad.

A `test/components/sidebar-scroll.test.js` integration test
reconstructs the full chain in a constrained 600×1024 box and asserts
the panel scrolls internally, the pad area's height is unchanged when
all three accordions open, and the container has no page scroll. The
prior solo-panel test couldn't catch the regression because the bug
only emerges when the sibling pad-area is also in the picture.
