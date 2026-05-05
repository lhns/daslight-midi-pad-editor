# 8. Button addresses sourced from canonical XML templates

## Status
Accepted.

## Context
Each profile needs the full list of (status, note) pairs for its
controller's buttons, plus a row/column mapping to a 9×9 UI grid.

`docs/every-button.xml` (Launchpad) and
`docs/every-button-AkaiApcMini.xml` (APC mini) are Daslight exports that
contain exactly one entry per physical button. They are the source of
truth for what the device actually exposes.

## Decision
- For **Launchpad Mini MK3**, the layout module is **derived once** from
  `docs/every-button.xml` (see commit history) into a static
  `src/devices/launchpad-mini-mk3/layout.js`. The note→grid mapping is
  algorithmic (`tens digit = row, ones digit = col`).
- For **Akai APC mini MK1**, the physical layout (track row, scene column,
  shift button) is too irregular to derive purely from the XML, so
  `src/devices/akai-apc-mini/layout.js` defines the mapping explicitly with
  per-button color constraints.
- A loaded XML file may **omit** buttons. Missing buttons render as
  "unbound" (greyed out, not editable). We never add a `<SHORTCUT>` the
  user did not have in their original file.

## Consequences
- Documenting the templates in `docs/` keeps the data origin obvious to
  future contributors.
- Tests use the same template files as fixtures via `fetch('/docs/...')`.
