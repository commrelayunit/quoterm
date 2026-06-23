# Quoterm comparison example

Minimal Vite app for checking Quoterm's inline quote behavior.

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

The page is intentionally plain light-mode UI. It includes one interactive Quoterm example for each variant:

- Success
- Warning
- Error
- Info

Each Quoterm result is inserted immediately above the clicked control as a compact quote line:

```text
> severity: message
```

Success and info examples use `duration: 5000` and auto-dismiss. Warning and error examples use `duration: 0` and persist until the close button is pressed. Scroll the page after triggering a quote to confirm it moves naturally with the row because it is in normal document flow.
