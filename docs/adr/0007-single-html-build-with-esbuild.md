# 7. Single-HTML distribution via esbuild

## Status
Accepted.

## Context
The user wants to share the editor as a single, doubleclick-able file —
no install, no server, no CDN at runtime. The dev workflow uses ES modules
and import maps (ADR 0001), but the final artifact must collapse all of
that into one HTML file.

## Decision
- `npm run build` runs `scripts/build-single-html.mjs`.
- esbuild bundles `src/app.js` with `bundle: true, format: 'esm',
  minify: true`, resolving `lit` from `node_modules`.
- The bundled JS is inlined as a single `<script type="module">` into a
  copy of `index.html`. The import map and external `<script src>` tag are
  removed; the stylesheet is inlined as `<style>`.
- Output: `dist/daslight-midi-pad-editor.html`. No external requests at runtime.

We considered a hand-rolled module concatenator. Rejected: would have to
re-implement tree-shaking and circular-import handling. esbuild is a
well-trodden 5MB dependency that does this in milliseconds.

## Consequences
- esbuild is a build-time-only dependency. Runtime stays bundler-free.
- The artifact is portable and offline-capable; it can be emailed or hosted
  on any static server, including Gitea releases.
