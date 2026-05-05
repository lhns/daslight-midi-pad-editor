# 2. DOM-based pad rendering instead of Canvas

## Status
Accepted.

## Context
The pad is an 81-cell grid where each cell needs hover, click,
keyboard focus, multi-select, three independently-animated stripes, and an
optional outline-ring for selection state.

## Decision
Render each button as a Lit component with three stacked `<div>` stripes,
laid out via CSS Grid. Animations (flash, pulse) are CSS keyframes.

## Consequences
- Accessibility, keyboard input, and DevTools inspection come for free.
- CSS animations stay in sync regardless of frame rate.
- No need to manage redraws on selection / hover state changes.
- Performance is fine: 81 buttons × 3 stripes = 243 elements, well below any
  rendering threshold.
