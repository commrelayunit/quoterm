import * as React from "react";
import { createRoot } from "react-dom/client";
import { QuotermHost, dismissQuoterm, quoterm } from "quoterm";
import type { QuotermPlacement, QuotermTheme, QuotermVariant } from "quoterm";
import "quoterm/style.css";
import "./styles.css";

type DurationMode = "persistent" | "timed";

interface Example {
  variant: QuotermVariant;
  label: string;
  message: string;
  button: string;
}

const examples: Example[] = [
  {
    variant: "success",
    label: "Success",
    message: "settings saved",
    button: "Save settings",
  },
  {
    variant: "warning",
    label: "Warning",
    message: "2 records need review",
    button: "Sync library",
  },
  {
    variant: "error",
    label: "Error",
    message: "prepack checks failed",
    button: "Publish package",
  },
  {
    variant: "info",
    label: "Info",
    message: "indexing started",
    button: "Index corpus",
  },
];

function ExampleRow({
  example,
  duration,
  placement,
}: {
  example: Example;
  duration: number;
  placement: QuotermPlacement;
}) {
  return (
    <section className="example-row" aria-labelledby={`${example.variant}-heading`}>
      <div>
        <h2 id={`${example.variant}-heading`}>{example.label}</h2>
        <p className="sample-line">
          &gt; {example.variant}: {example.message}
        </p>
      </div>
      <div className="actions">
        <button
          type="button"
          onClick={(event) => {
            quoterm({
              source: event.currentTarget,
              placement,
              variant: example.variant,
              message: example.message,
              duration,
            });
          }}
        >
          {example.button}
        </button>
      </div>
    </section>
  );
}

function App() {
  const [placement, setPlacement] = React.useState<QuotermPlacement>("before");
  const [theme, setTheme] = React.useState<QuotermTheme>("light");
  const [durationMode, setDurationMode] = React.useState<DurationMode>("timed");
  const [maxItems, setMaxItems] = React.useState(4);
  const duration = durationMode === "timed" ? 5000 : 0;

  return (
    <main>
      <header>
        <h1>Quoterm inline quote playground</h1>
        <p>
          Click a control to insert a real inline DOM quote near it. Tune placement, theme, duration, and visible item
          count without touching the source.
        </p>
        <p className="sample-line">&gt; severity: message</p>

        <form className="playground-controls" aria-label="Quoterm playground controls">
          <label>
            Placement
            <select value={placement} onChange={(event) => setPlacement(event.currentTarget.value as QuotermPlacement)}>
              <option value="before">Before / above source</option>
              <option value="after">After / below source</option>
            </select>
          </label>

          <label>
            Theme
            <select value={theme} onChange={(event) => setTheme(event.currentTarget.value as QuotermTheme)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </label>

          <label>
            Duration
            <select value={durationMode} onChange={(event) => setDurationMode(event.currentTarget.value as DurationMode)}>
              <option value="timed">Auto-dismiss after 5s</option>
              <option value="persistent">Persistent</option>
            </select>
          </label>

          <label>
            Max visible
            <input
              type="number"
              min="1"
              max="8"
              value={maxItems}
              onChange={(event) => setMaxItems(Number(event.currentTarget.value) || 1)}
            />
          </label>
        </form>

        <div className="toolbar">
          <button type="button" onClick={() => dismissQuoterm()}>
            Clear Quoterm
          </button>
        </div>
      </header>

      <div className="examples">
        {examples.map((example) => (
          <ExampleRow key={example.variant} example={example} placement={placement} duration={duration} />
        ))}
      </div>

      <QuotermHost maxItems={maxItems} theme={theme} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
