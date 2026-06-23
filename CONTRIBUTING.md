# Contributing to Quoterm

Thanks for helping improve Quoterm. Keep contributions small, documented, and accessible.

## Local setup

```sh
git clone https://github.com/commrelayunit/quoterm.git
cd quoterm
npm install
```

Quoterm is a React/TypeScript package. React and React DOM are peer dependencies for consumers and dev dependencies for local tests/builds.

## Development commands

```sh
npm run lint        # ESLint
npm run typecheck   # TypeScript without emit
npm test            # Vitest test suite
npm run build       # ESM/CJS bundles, declarations, CSS copies
npm pack --dry-run  # inspect publishable package contents
```

Run the relevant gates before opening a PR. For behavior or API changes, run all of them.

## Pull request expectations

- Explain the problem, the chosen fix, and any tradeoffs.
- Include tests for logic, accessibility defaults, API behavior, or regressions where practical.
- Update `README.md` when changing public API, styling hooks, package exports, or usage guidance.
- Keep PRs focused. Do not mix formatting sweeps with feature work.
- Include screenshots/GIFs for visual changes when available. If media is not available, say what should be captured.

## Code and style expectations

- Use TypeScript and keep public types explicit.
- Keep the package dependency-light; avoid adding runtime dependencies unless the gain is clear.
- Prefer small, readable functions over clever abstractions.
- Preserve SSR safety: browser globals must be guarded.
- Keep CSS class names and variables stable unless the change is intentionally breaking and documented.
- Do not add private project names, local machine paths, credentials, analytics tokens, or product-specific assumptions.

## Accessibility expectations

Quoterm is feedback UI, so accessibility changes matter.

- Preserve sensible live-region defaults: success/info are polite status messages; warning/error are assertive alerts.
- Keep dismiss controls keyboard reachable and labeled.
- Do not trap focus or steal focus for routine feedback.
- Ensure messages remain concise and actionable.
- Maintain usable contrast for default success, warning, error, and info variants.
- Test anchored and fallback placement so feedback remains near its source without covering the control unnecessarily.

## Release and npm publish notes

Publishing is maintainer-only and requires explicit approval.

Before publishing:

1. Confirm npm ownership/name while logged in.
2. Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`.
3. Inspect the tarball contents and ensure only intended public files are included.
4. Check for accidental personal info, local paths, credentials, or private implementation details.
5. Tag the release, then publish with `npm publish --access public` only after approval.

Do not publish from a drive-by PR or automation unless the maintainer has explicitly authorized that release.
