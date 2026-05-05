# 9. Gitea Actions for CI/CD

## Status
Accepted.

## Context
The project is hosted on a Gitea instance. We want automated test runs on
every push and a downloadable build artifact on merges to `main`.

## Decision
- `.gitea/workflows/ci.yml` defines two jobs: `test` and `build`.
- `test` runs on every push and PR: `npm ci`, install Playwright Chromium,
  `npm test`.
- `build` runs only on `main` and on tags pushed as `v*`: builds the
  single-HTML artifact and uploads it via `actions/upload-artifact`.
- Tag pushes (`v*`) additionally attach `dist/index.html` to a Gitea
  release using `akkuman/gitea-release-action`.

We chose **artifact upload over Pages-style hosting** because the
distribution model is "send someone the HTML", not "host a web app". The
artifact is the deliverable.

## Consequences
- Releases double as a versioned download index for the editor.
- The `build` job depends on `test` — broken tests block artifact upload.
