import * as React from "react";
import { createRoot } from "react-dom/client";
import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";
import { ToastContainer, toast as toastify } from "react-toastify";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { QuotermHost, dismissQuoterm, quoterm } from "quoterm";
import "quoterm/style.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

type Variant = "success" | "warning" | "error" | "info";

interface Example {
  variant: Variant;
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

function showToastExample(example: Example) {
  const text = `${example.label}: ${example.message}`;

  if (example.variant === "success") {
    hotToast.success(text);
    sonnerToast.success(example.label, { description: example.message });
    toastify.success(text);
    return;
  }

  if (example.variant === "error") {
    hotToast.error(text);
    sonnerToast.error(example.label, { description: example.message });
    toastify.error(text);
    return;
  }

  if (example.variant === "warning") {
    hotToast(text, { icon: "!" });
    sonnerToast.warning(example.label, { description: example.message });
    toastify.warning(text);
    return;
  }

  hotToast(text, { icon: "i" });
  sonnerToast.info(example.label, { description: example.message });
  toastify.info(text);
}

function ExampleRow({ example }: { example: Example }) {
  return (
    <section className="example-row" aria-labelledby={`${example.variant}-heading`}>
      <div>
        <h2 id={`${example.variant}-heading`}>{example.label}</h2>
        <p className="sample-line">&gt; {example.variant}: {example.message}</p>
      </div>
      <div className="actions">
        <button
          type="button"
          onClick={(event) => {
            quoterm({
              source: event.currentTarget,
              variant: example.variant,
              message: example.message,
              duration: example.variant === "success" || example.variant === "info" ? 5000 : 0,
            });
          }}
        >
          {example.button}
        </button>
        <button type="button" className="secondary" onClick={() => showToastExample(example)}>
          Show toast comparison
        </button>
      </div>
    </section>
  );
}

function App() {
  return (
    <main>
      <header>
        <h1>Quoterm inline quote examples</h1>
        <p>
          Click a control to show the quote beside it. Success and info quotes auto-fade after 5 seconds; warning and
          error quotes persist until dismissed. Each Quoterm message uses the form:
        </p>
        <p className="sample-line">&gt; severity: message</p>
        <div className="toolbar">
          <button type="button" onClick={() => dismissQuoterm()}>
            Clear Quoterm
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              hotToast.dismiss();
              sonnerToast.dismiss();
              toastify.dismiss();
            }}
          >
            Clear toasts
          </button>
        </div>
      </header>

      <div className="examples">
        {examples.map((example) => (
          <ExampleRow key={example.variant} example={example} />
        ))}
      </div>

      <QuotermHost maxItems={4} />
      <HotToaster position="bottom-right" />
      <SonnerToaster position="top-right" richColors closeButton />
      <ToastContainer position="bottom-left" newestOnTop />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
