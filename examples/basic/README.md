# Quoterm basic demo

This folder documents a tiny example app that can be used later to capture README screenshots/GIFs.

## Goal

Capture these states:

1. Quoterm inserted immediately above a clicked button/control.
2. One clear light-mode interaction each for success, warning, error, and info.
3. Compact quote text in the form `> severity: message`, including `> info: message` for the blue info variant.
4. Positive `duration` auto-dismisses success/info examples; `duration: 0` keeps warning/error examples persistent until closed.

## Minimal app sketch

```tsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { QuotermHost, quoterm } from 'quoterm';
import 'quoterm/style.css';

function Demo() {
  return (
    <main style={{ padding: 48 }}>
      <h1>Quoterm demo</h1>
      <p>Click each control to insert feedback immediately above that source.</p>

      {[
        ['success', 'Save settings', 'settings saved'],
        ['warning', 'Sync library', '2 records need review'],
        ['error', 'Publish package', 'prepack checks failed'],
        ['info', 'Index corpus', 'indexing started'],
      ].map(([variant, label, message]) => (
        <button
          key={variant}
          onClick={(event) =>
            quoterm({
              source: event.currentTarget,
              variant: variant as 'success' | 'warning' | 'error' | 'info',
              message,
              duration: variant === 'success' || variant === 'info' ? 5000 : 0,
            })
          }
        >
          {label}
        </button>
      ))}

      <QuotermHost theme="light" />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Demo />);
```

This is intentionally documentation-only for now; do not treat it as generated screenshot evidence.
