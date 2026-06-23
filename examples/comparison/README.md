# Quoterm comparison example

Minimal Vite app for checking Quoterm's inline quote behavior.

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

The page is intentionally plain light-mode UI. It includes one interactive Quoterm example for each variant:

- Success
- Warning
- Error
- Info

Each Quoterm result appears beside the clicked control as a compact quote line:

```text
> severity: message
```

Success and info examples use `duration: 5000` and auto-dismiss. Warning and error examples use `duration: 0` and persist until the close button is pressed. Scroll the page after triggering a quote to confirm it remains visually associated with its control.

A secondary button can trigger common toast libraries for a lightweight comparison, but the page prioritizes the corrected Quoterm behavior.

## Dependency boundary

Do not copy this example's toast/UI/demo dependencies into the root package `dependencies` or `peerDependencies`. They are for demonstration only and are installed separately under `examples/comparison`.
