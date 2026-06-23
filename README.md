# Quoterm

[![npm planned](https://img.shields.io/badge/npm-planned-lightgrey)](#installation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2%2B%20%7C%2019-61dafb)](https://react.dev/)

Quoted terminal-style inline feedback for React — a focused alternative to toast popups.

Quoterm is for messages that should stay near the thing they explain: CLI-style command results, form feedback, generated citations, background task status, import warnings, and other “this happened here” UI moments. Toasts float away from context; Quoterm anchors feedback near the source.

> Status: public package skeleton is ready, but **not published to npm yet**. Do not rely on `npm install quoterm` until the first release is explicitly published.

## Installation

Future npm install, once published:

```sh
npm install quoterm
```

Until then, install from GitHub or copy the component source:

```sh
npm install github:commrelayunit/quoterm
```

```tsx
import { QuotermHost, quoterm } from 'quoterm';
import 'quoterm/style.css';
```

`quoterm/styles.css` is also exported as a compatibility alias.

## Quick start

Render one host near the root of your app, then trigger feedback from actions, command panels, forms, or async tasks.

```tsx
import { QuotermHost, quoterm } from 'quoterm';
import 'quoterm/style.css';

export function App() {
  return (
    <>
      <button
        onClick={(event) => {
          quoterm({
            source: event.currentTarget,
            variant: 'success',
            command: 'save settings',
            title: 'Saved',
            message: 'The new API key will be used on the next request.',
          });
        }}
      >
        Save settings
      </button>
      <QuotermHost />
    </>
  );
}
```

## Visual examples

Final screenshots/GIFs are not included yet. These placeholders mark the exact media the project should capture before or shortly after the first public release; they are intentionally not fabricated.

### Anchored near the clicked control

> **Media slot:** Screenshot/GIF showing a user clicking a button and a Quoterm message appearing beside that same control.
>
> Suggested filename: `docs/media/quoterm-anchored-control.gif`

### Success, warning, and error variants

> **Media slot:** Screenshot showing the default `success`, `warning`, and `error` variants together, with readable contrast and visible dismiss controls.
>
> Suggested filename: `docs/media/quoterm-variants.png`

### Quoterm versus a traditional corner toast

> **Media slot:** Side-by-side screenshot/GIF contrasting contextual Quoterm feedback near the source with a detached lower-corner toast.
>
> Suggested filename: `docs/media/quoterm-vs-toast.gif`

A runnable comparison app lives in [`examples/comparison`](examples/comparison/README.md). It shows Quoterm beside the clicked control and compares it with `react-hot-toast`, `sonner`, and `react-toastify` across success, warning, error, async, validation, and destructive-action scenarios.

Run it separately from the package root:

```sh
npm install
cd examples/comparison
npm install
npm run dev
```

The example app intentionally carries its own demo dependencies. Installing or publishing the `quoterm` package remains lightweight; toast/demo dependencies must not be added to the root package runtime or peer dependencies.

## API

### `quoterm(input)`

Creates or replaces a feedback item and returns controls for that item.

```ts
type QuotermVariant = 'success' | 'warning' | 'error' | 'info';
type QuotermPlacement = 'auto' | 'top' | 'bottom';
type QuotermSource = EventTarget | Element | React.RefObject<Element | null> | DOMRect | null;

interface QuotermInput {
  id?: string;
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  variant?: QuotermVariant;
  command?: string;
  source?: QuotermSource;
  sourceRect?: DOMRect | null;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  dismissLabel?: string;
  placement?: QuotermPlacement;
  role?: 'status' | 'alert';
  ariaLive?: 'off' | 'polite' | 'assertive';
}
```

### `QuotermHost(props)`

Renders active feedback in a portal. Add one host per app or per bounded surface.

```ts
interface QuotermHostProps {
  className?: string;
  maxItems?: number;
  gutter?: number;
  maxWidth?: number;
  zIndex?: number;
  portalTarget?: Element | DocumentFragment | null;
  renderIcon?: (variant: QuotermVariant) => React.ReactNode;
  formatCommand?: (variant: QuotermVariant, item: QuotermState) => string;
}
```

Other exports: `useQuoterm`, `dismissQuoterm`, `getQuotermsSnapshot`, and public TypeScript types.

## Variants

- `success` — completed actions.
- `warning` — recoverable issues or caveats.
- `error` — failed actions.
- `info` — neutral progress, hints, generated output.

```tsx
quoterm({ variant: 'warning', title: 'Token expires in 5 minutes.' });
quoterm({ variant: 'error', title: 'Build failed', message: 'Check stderr above.' });
```

Warnings and errors default to `role="alert"` and assertive announcements. Success and info default to `role="status"` and polite announcements.

## Anchoring and fallback placement

Pass `source`, `sourceRect`, or a React ref to anchor feedback to the UI element that caused it.

```tsx
quoterm({
  source: buttonRef,
  placement: 'auto',
  command: 'npm run build',
  title: '2 warnings, 0 errors',
});
```

If no source is available, Quoterm falls back to a stable viewport position near the lower right. It does not manage global product semantics for you: render the host for the surface that owns the feedback.

## Dismissal and duration

```tsx
const notice = quoterm({ title: 'Index refresh queued', duration: 6000 });
notice.update({ message: 'Worker accepted the job.' });
notice.dismiss();

dismissQuoterm(); // dismiss all
```

`duration: 0` keeps feedback persistent. Persistent inline feedback is usually better for errors and warnings.

## Styling customization

Import the default stylesheet:

```tsx
import 'quoterm/style.css';
```

Then override classes or CSS variables:

```css
.my-feedback {
  --quoterm-bg: #111827;
  --quoterm-fg: #f9fafb;
  --quoterm-muted: #a78bfa;
  --quoterm-border: rgb(167 139 250 / 0.65);
}
```

```tsx
quoterm({ className: 'my-feedback', title: 'Queued for review' });
```

The package marks CSS as a side effect so bundlers do not accidentally tree-shake `style.css` / `styles.css`. JavaScript modules remain tree-shakeable.

## Accessibility

- `success` and `info` default to `role="status"` and `aria-live="polite"`.
- `warning` and `error` default to `role="alert"` and `aria-live="assertive"`.
- Dismiss buttons include a configurable accessible label.
- `aria-atomic="true"` is applied to each feedback item.
- Feedback is visually anchored to its source, preserving context better than detached global toasts.
- Keep message text concise and actionable; do not use Quoterm for long logs.

## Why not a toast?

Use a toast when the message is global, disposable, and unrelated to the current focus. Use Quoterm when the feedback has a source: a command, field, quote, citation, generated block, file, or action result. It is intentionally quieter, more inspectable, and less prone to stealing attention.

## Package decisions

- Package name: `quoterm`. The npm registry returned 404 during readiness checks on 2026-06-23, so the name appears available, but final publish still needs owner login and approval.
- Version starts at `0.1.0` until the API settles.
- Builds ESM and CJS with TypeScript declarations via `tsup` for broad React app compatibility.
- React and React DOM are peer dependencies (`>=18.2.0 <20`) and dev dependencies for local builds.
- `exports` exposes the root module, `style.css`, `styles.css`, and `package.json`.
- `files` publishes only `dist`, `README.md`, and `LICENSE`.
- `sideEffects` preserves CSS imports while keeping JS tree-shakeable.

## Contributing and issue reports

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, development commands, PR expectations, accessibility expectations, and release notes.
- Report reproducible bugs with the [bug report template](https://github.com/commrelayunit/quoterm/issues/new?template=bug_report.md).
- Suggest API, UX, styling, or accessibility improvements with the [feature request template](https://github.com/commrelayunit/quoterm/issues/new?template=feature_request.md).

Please include screenshots or GIFs for visual, placement, animation, or contrast issues when possible.

## Publishing checklist

Do not publish without explicit maintainer approval.

1. Confirm package ownership/name on npm while logged in.
2. Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`.
3. Review the tarball contents.
4. Tag the release and publish with `npm publish --access public`.
5. Replace the npm-planned badge with a live npm/version badge after publication.

## License

MIT
