# Quoterm 0.1.6 comparison example

Minimal Vite playground for checking Quoterm's source-bound quote behavior.

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

Each Quoterm result is anchored to the clicked control. The controls at the top let you compare:

- `renderMode="adjacent"`: feedback sits beside the source without shifting buttons.
- `renderMode="overlay"`: feedback is fixed above/below the source without layout shift.
- `renderMode="inline"`: feedback is inserted before/after the source in document flow and can move surrounding layout.
- `showCommandChrome={false}`: product-style feedback without `$ command`, `>`, or severity-prefix chrome.
- `showCommandChrome={true}`: the original terminal-style quote presentation.

With command chrome visible, Quoterm renders a compact quote line:

```text
> severity: message
```

Use the remaining controls to switch placement, theme, and timed versus persistent duration. In adjacent and overlay modes, scroll the page after triggering a quote to confirm the feedback stays attached to its source without moving that source.
