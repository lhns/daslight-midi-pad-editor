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
- Tag pushes (`v*`) additionally attach `dist/daslight-midi-pad-editor.html` to a Gitea
  release using `akkuman/gitea-release-action`.

We chose **artifact upload over Pages-style hosting** because the
distribution model is "send someone the HTML", not "host a web app". The
artifact is the deliverable.

## Consequences
- Releases double as a versioned download index for the editor.
- The `build` job depends on `test` — broken tests block artifact upload.

## Update — GitHub mirror
The repo is also mirrored to `https://github.com/lhns/daslight-midi-pad-editor.git`.
`.github/workflows/ci.yml` is the GitHub-Actions equivalent of the
Gitea workflow — functionally identical (test → build → artifact, plus
tag → release). Provider differences:

- `actions/upload-artifact@v4` (not `@v3`, which is deprecated on
  GitHub since January 2025).
- Release step uses `softprops/action-gh-release@v2` instead of
  `akkuman/gitea-release-action@v1`; picks up the implicit
  `GITHUB_TOKEN`.
- Explicit `permissions: contents: write` at the build job so the
  release step can create / update the GitHub release. GitHub's
  default token permissions are read-only.
- `cache: 'npm'` on `actions/setup-node@v4` for faster reruns
  (relies on the committed `package-lock.json`).
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress:
  true }` so push-on-push to the same ref cancels older runs.

Both workflow files coexist: a push to Gitea triggers the Gitea
workflow; a push to GitHub triggers the GitHub one. The Gitea
workflow could later pick up the cache and concurrency improvements
if useful.
