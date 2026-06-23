# Quoterm comparison example

Minimal Vite playground for checking Quoterm's inline quote behavior.

This example intentionally stays plain. The root `quoterm` package remains lean: React/React DOM are the only peer dependencies.

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

The page is intentionally plain UI. It includes one interactive Quoterm example for each variant:

- Success
- Warning
- Error
- Info

Each Quoterm result is inserted immediately before/above or after/below the clicked control as a compact quote line:

```text
> severity: message
```

Use the controls at the top of the page to switch placement, theme, timed versus persistent duration, and the host's max visible item count. Scroll the page after triggering a quote to confirm it moves naturally with the row because it is in normal document flow.
