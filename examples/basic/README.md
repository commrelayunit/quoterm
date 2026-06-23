# Quoterm basic demo

This folder documents a tiny example app that can be used later to capture README screenshots/GIFs.

## Goal

Capture these states:

1. Quoterm anchored near a clicked button/control.
2. Success, warning, and error variants.
3. A traditional corner toast mock beside Quoterm to show the context difference.

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
      <p>Click each control to show feedback anchored near the source.</p>

      <button
        onClick={(event) =>
          quoterm({
            source: event.currentTarget,
            variant: 'success',
            command: 'save settings',
            title: 'Saved',
            message: 'The change is ready for the next request.',
            duration: 0,
          })
        }
      >
        Save settings
      </button>

      <button
        onClick={(event) =>
          quoterm({
            source: event.currentTarget,
            variant: 'warning',
            command: 'sync library',
            title: 'Synced with warnings',
            message: 'Two records need manual review.',
            duration: 0,
          })
        }
      >
        Sync library
      </button>

      <button
        onClick={(event) =>
          quoterm({
            source: event.currentTarget,
            variant: 'error',
            command: 'publish package',
            title: 'Publish blocked',
            message: 'Run the prepublish checks first.',
            duration: 0,
          })
        }
      >
        Publish package
      </button>

      <aside aria-label="Traditional toast mock" style={{ position: 'fixed', right: 16, bottom: 16 }}>
        Traditional toast location
      </aside>

      <QuotermHost />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Demo />);
```

This is intentionally documentation-only for now; do not treat it as generated screenshot evidence.
