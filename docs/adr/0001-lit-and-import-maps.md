# 1. Lit + Import Maps, no dev bundler

## Status
Accepted.

## Context
The app is a small, single-purpose editor. The user explicitly asked for Lit
and import maps. They want to avoid the cognitive overhead of a Vite/Webpack
toolchain in development.

## Decision
- Use **Lit 3** for components.
- Load `lit` via an `<script type="importmap">` from a CDN (`esm.sh`).
- All source files are native ES modules served as-is by `@web/dev-server`.
- A **build step** exists (esbuild) but only runs for distribution
  (`npm run build`), not in the dev loop. See ADR 0007.

## Consequences
- Zero build wait during dev — edit, save, reload.
- Tests run in a real browser (Web Test Runner), not jsdom — useful because
  shadow DOM and CSS animations are real.
- Runtime depends on a CDN at dev time. Build artifact does not (Lit is
  inlined into `dist/index.html`).
