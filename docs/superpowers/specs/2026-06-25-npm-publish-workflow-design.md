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
   - Runs `npm publish --provenance --access public` using npm Trusted Publishing (OIDC)
   - Requires npm package Trusted Publisher configuration, not an `NPM_TOKEN` secret
   - Requires permissions: `id-token: write`, `contents: read`
   - Uses Node 24 so the bundled npm satisfies npm Trusted Publishing requirements
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

No `NPM_TOKEN` or `NODE_AUTH_TOKEN` is used. npm Trusted Publishing should be configured on npmjs.com for:

- GitHub organization/repository: `commrelayunit/quoterm`
- Workflow filename: `release.yml`
- Allowed action: `npm publish`

Because `quoterm` is not yet published on npm, the first package creation may need to be done manually by an npm package owner before Trusted Publishing can be attached to the package.

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
