# GitHub Actions npm Publish Workflow — Design Spec

**Date**: 2026-06-25
**Branch**: `feat/npm-publish-workflow`

## Overview

Automate building and publishing the `quoterm` React component library to npm whenever a version tag is pushed. A separate CI workflow provides continuous quality feedback on PRs and pushes to `main`.

## Goals

- Publish to npm automatically on `v*` tag push
- Run quality gates (typecheck, lint, test, build) on every PR and push to `main`
- Include npm provenance attestation on published packages
- Auto-create a GitHub Release with generated changelog on every publish

## Non-Goals

- Manual version bumping (the developer runs `npm version` and pushes the tag locally)
- Changelog maintenance (auto-generated from commit history via GitHub)
- Private registry or scoped package support

## Architecture

Two workflow files under `.github/workflows/`:

### `ci.yml` — Continuous Integration

**Trigger**: `push` to `main`, `pull_request` targeting `main`

**Jobs** (all parallel, Node 20 LTS):
- `typecheck` — runs `npm run typecheck` (`tsc --noEmit`)
- `lint` — runs `npm run lint`
- `test` — runs `npm run test`
- `build` — runs `npm run build` (catches broken builds before they reach release)

Each job runs `npm ci` independently before its check.

### `release.yml` — npm Publish + GitHub Release

**Trigger**: `push: tags: ['v*']`

**Assumption**: The tagged commit has already passed CI on `main`. Quality checks are not re-run here.

**Jobs** (sequential):

1. **`publish`**
   - Runs `npm ci`
   - Runs `npm publish --provenance --access public` using a granular npm automation token stored as `NPM_TOKEN`
   - Requires GitHub repository secret `NPM_TOKEN` containing a granular npm token with publish permission and bypass 2FA enabled
   - Uses `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` for npm authentication; `id-token: write` remains enabled for npm provenance attestation
   - Uses Node 24 so the bundled npm supports provenance publishing cleanly
   - The existing `prepack` script in `package.json` runs `build` automatically before publish

2. **`create-release`** (depends on `publish`)
   - Uses the pre-installed `gh` CLI (`gh release create`) — no third-party action needed
   - Creates a GitHub Release on the pushed tag with `--generate-notes` for auto-generated changelog from commits since last tag
   - Requires permission: `contents: write`

## Release Flow

```
# Developer workflow
npm version patch   # bumps version in package.json, commits, creates tag
git push origin main --follow-tags

# What fires automatically
→ ci.yml: typecheck + lint + test + build (parallel) on the push to main
→ release.yml: npm publish --provenance --access public → create GitHub Release
```

## Secrets & Permissions

| Secret / Permission | Where | Purpose |
|---|---|---|
| `id-token: write` | `publish` job permissions | Authenticate npm Trusted Publishing and provenance attestation via OIDC |
| `contents: read` | `publish` job permissions | Read repository contents for npm publish |
| `contents: write` | `create-release` job permissions | Create GitHub Release |

`NPM_TOKEN` is required as a GitHub repository secret. It should be a granular npm token with:

- package access: publish/read-write for `quoterm` (or all packages until the package exists, then narrow if npm allows)
- bypass 2FA enabled for automation
- the shortest practical expiration

`NODE_AUTH_TOKEN` is set only inside the publish step from `${{ secrets.NPM_TOKEN }}`.

## Files Changed

```
.github/
  workflows/
    ci.yml          (new)
    release.yml     (new)
docs/
  superpowers/
    specs/
      2026-06-25-npm-publish-workflow-design.md   (this file)
```

No changes to `package.json`, `tsup` config, or source files.
