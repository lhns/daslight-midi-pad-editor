# 6. Test in a real browser with Web Test Runner

## Status
Accepted.

## Context
The app uses Lit (shadow DOM), CSS animations, and `DOMParser` /
`XMLSerializer`. Testing in jsdom or Node would require shimming each of
those and would not exercise the code paths that actually ship.

## Decision
Use **Web Test Runner** with the **Playwright** launcher (headless
Chromium) and **`@open-wc/testing`** for fixture / assertion helpers.
Tests sit in `test/` mirroring the `src/` tree.

Coverage targets:

- Per-profile `OutCodec` round-trip — both LP MK3 (with all 3 modes) and
  APC mini (with status-128 acceptance and per-button constraints).
- `detectProfile` resolves correctly against each fixture XML.
- Top-level XML round-trip (parse → buildModel → applyModel → serialize)
  on untouched files is **byte-identical** to input.
- DEVICEOUT validation/fix on `example-input.xml`.
- Selection helpers (pure logic).
- Component smoke tests for `<pad-button>` (stripes + animation classes).

## Consequences
- CI needs Playwright's chromium dependencies (`npx playwright install
  --with-deps chromium` step in the workflow).
- Tests are slower than node-based tests but match real runtime.
