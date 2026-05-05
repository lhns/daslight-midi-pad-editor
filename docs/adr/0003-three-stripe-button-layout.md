# 3. Three horizontal stripes per button

## Status
Accepted.

## Context
Each button has three independent LED states — Off, On, Fade — and the user
must see all three at a glance.

## Decision
Each button shows three horizontal stripes from top to bottom: **Off, On,
Fade**. Stripes carry the LED color and animate (flash / pulse) per the
state's animation kind.

The user's brief considered diagonals or pie slices; horizontal stripes
won because they (a) align across the grid, making patterns easy to scan,
and (b) animate cleanly on any display size.

## Consequences
- Selection ring is on the whole button, not per stripe.
- The settings panel offers a control-state pill switcher (Off/On/Fade) so
  edits target one stripe at a time.
