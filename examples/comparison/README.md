# Quoterm comparison example

Runnable Vite app for comparing Quoterm against common React toast libraries.

This example intentionally has its own dependencies. The root `quoterm` package stays lean: React/React DOM remain the only peer dependencies, and toast/demo libraries live only in this example app.

## Run locally

From a fresh clone:

```sh
npm install
cd examples/comparison
npm install
npm run dev
```

Then open the Vite URL, usually <http://127.0.0.1:5173/>.

You can also build it:

```sh
cd examples/comparison
npm run build
```

## What it demonstrates

The app includes scenarios for:

- Success feedback
- Warning feedback
- Error feedback
- Async operation progress/update
- Form validation feedback
- Destructive action feedback

Each scenario can trigger:

- Quoterm anchored beside the clicked control
- `react-hot-toast`
- `sonner`
- `react-toastify`
- All libraries at once for side-by-side screenshot/GIF capture

## Capture points

Suggested README media:

- `docs/media/quoterm-anchored-control.gif` — click a “Quoterm near control” button.
- `docs/media/quoterm-variants.png` — trigger Success, Warning, and Error with Quoterm.
- `docs/media/quoterm-vs-toast.gif` — click “Compare all” to show contextual Quoterm versus detached toasts.

## Dependency boundary

Do not copy this example's toast/UI/demo dependencies into the root package `dependencies` or `peerDependencies`. They are for demonstration only and are installed separately under `examples/comparison`.
