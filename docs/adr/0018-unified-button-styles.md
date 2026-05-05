# 18. Unified button styles via a shared Lit `css` module

## Status
Accepted.

## Context
The app evolved with three different button looks side by side:

1. **Browser default.** Toolbar (Open another, Download XML), Banner
   (Fix all), Sidebar (Copy all, Paste all, Copy, Paste), Drop-Zone
   (Choose file…). All of these are `<button>` elements rendered
   inside Lit components, and the global `button { ... }` rule in
   `src/style.css` does not cross shadow DOM — so they fell back to
   the user agent's default button styling.
2. **`.mode-btn`** in `src/components/color-palette.js` — explicitly
   styled with a `--panel-2` background and a `--border` border.
   Sat *inside* a `<details>[open]` whose own background is also
   `--panel-2`, so the button blended into the container; the border
   color was three hex points off the surface and barely visible.
3. **`.pill`** in `src/components/launchpad-grid.js` — same look as
   `.mode-btn`, plus `border-radius: 999px`. Pressed state used an
   accent outline.

The result was visually inconsistent and hard to navigate.

## Decision
Define one `buttonStyles` Lit `css` template in
`src/styles/buttons.js` and import it into every component that
renders a `<button>`. Each component does:

```js
static styles = [buttonStyles, css`/* layout */`];
```

The shared rules cover **all** `<button>` elements in the component's
shadow root and are paired with class-based variants so callers don't
have to copy any styling:

- default — translucent tint that elevates the button against any
  surface.
- `.primary` — accent-tinted fill for one main action per region.
- `.pill` — round shape, otherwise inherits the default look.
- `[aria-pressed="true"]` / `.selected` — accent-tinted fill with a
  full-strength accent border, used by the filter pills and the
  mode selector.

We considered a `<app-button>` custom element wrapping `<button>`.
Rejected: the props matrix (variant, disabled, aria, click) didn't
justify the API surface, and the shared `css` module gives the same
result with less code.

We did **not** unify swatches in the color picker into the same
button look — they are color samples, not generic buttons, and they
keep a local class-scoped style. They use the same shared module but
override the parts that would otherwise tint or pad them.

### Translucent tints over fixed `--panel-X`

`background: rgba(255,255,255,0.04)` and
`border: 1px solid rgba(255,255,255,0.14)` instead of named surface
colors. White tints add a consistent perceptual lift on top of any
underlying dark surface — the same button reads "raised" on the page
background, on a panel, and inside a `<details>[open]`. With a fixed
`--panel-2` background, a button inside a `<details>[open]` (whose
own background is `--panel-2`) would be invisible.

### `color-mix` for accent variants

`color-mix(in srgb, var(--accent) 22%, transparent)` produces a
self-tinting fill that adapts to whatever `--accent` is. Browser
support is Chromium 111+, Firefox 113+, Safari 16.2+ — all covered
by our build target.

### Test-runner var fallbacks

`@web/test-runner` doesn't include `index.html`'s stylesheet, so
`var(--radius)` would resolve to `0` inside tests and our smoke
assertions would fail. The shared rules use `var(--radius, 6px)` and
`var(--accent, #3b82f6)` so the fallback values match the running
app.

## Consequences
- Adding a new button anywhere is `<button>` plus an optional class.
  No per-component styling.
- The smoke test (`test/components/button-styles.test.js`) catches a
  major regression: components that forget to import `buttonStyles`
  fail the border-radius assertion immediately.
- A future theme switch is one file: change the variables in
  `src/style.css` (and the fallbacks in `buttonStyles` if they ever
  diverge from the variables).
