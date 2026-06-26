import * as React from "react";
import { createRoot } from "react-dom/client";
import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast";
import { ToastContainer, toast as toastify } from "react-toastify";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { QuotermHost, dismissQuoterm, quoterm } from "quoterm";
import type { QuotermPlacement, QuotermTheme, QuotermVariant } from "quoterm";
import "quoterm/style.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

interface Scenario {
  id: string;
  label: string;
  variant: QuotermVariant;
  command: string;
  title: string;
  message: string;
  actionLabel: string;
}

const scenarios: Scenario[] = [
  {
    id: "success",
    label: "Success",
    variant: "success",
    command: "save settings",
    title: "Settings saved",
    message: "The new endpoint will be used on the next request.",
    actionLabel: "Save settings",
  },
  {
    id: "warning",
    label: "Warning",
    variant: "warning",
    command: "sync library",
    title: "Synced with warnings",
    message: "2 imported records need a manual citation check.",
    actionLabel: "Sync library",
  },
  {
    id: "error",
    label: "Error",
    variant: "error",
    command: "publish package",
    title: "Publish blocked",
    message: "Run the prepack checks before shipping this release.",
    actionLabel: "Publish package",
  },
  {
    id: "async",
    label: "Async operation",
    variant: "info",
    command: "index corpus",
    title: "Indexing started",
    message: "Quoterm can update in-place; toasts usually stack progress elsewhere.",
    actionLabel: "Index corpus",
  },
  {
    id: "validation",
    label: "Form validation",
    variant: "warning",
    command: "validate email",
    title: "Email needs attention",
    message: "Use a university address so reviewers can verify affiliation.",
    actionLabel: "Validate form",
  },
  {
    id: "destructive",
    label: "Destructive action",
    variant: "error",
    command: "delete dataset",
    title: "Deletion requires confirmation",
    message: "Type the dataset slug before removing 418 cached rows.",
    actionLabel: "Delete dataset",
  },
];

function showToastLibrary(library: "hot" | "sonner" | "toastify", scenario: Scenario) {
  const text = `${scenario.title}: ${scenario.message}`;

  if (library === "hot") {
    if (scenario.variant === "success") hotToast.success(text);
    else if (scenario.variant === "error") hotToast.error(text);
    else hotToast(text);
  }

  if (library === "sonner") {
    if (scenario.variant === "success") sonnerToast.success(scenario.title, { description: scenario.message });
    else if (scenario.variant === "error") sonnerToast.error(scenario.title, { description: scenario.message });
    else if (scenario.variant === "warning") sonnerToast.warning(scenario.title, { description: scenario.message });
    else sonnerToast.info(scenario.title, { description: scenario.message });
  }

  if (library === "toastify") {
    if (scenario.variant === "success") toastify.success(text);
    else if (scenario.variant === "error") toastify.error(text);
    else if (scenario.variant === "warning") toastify.warning(text);
    else toastify.info(text);
  }
}

function ScenarioCard({
  scenario,
  placement,
  theme,
  duration,
}: {
  scenario: Scenario;
  placement: QuotermPlacement;
  theme: QuotermTheme;
  duration: number;
}) {
  const cardRef = React.useRef<HTMLElement>(null);
  const asyncTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (asyncTimeoutRef.current !== null) window.clearTimeout(asyncTimeoutRef.current);
    };
  }, []);

  const fireQuoterm = () => {
    if (asyncTimeoutRef.current !== null) {
      window.clearTimeout(asyncTimeoutRef.current);
      asyncTimeoutRef.current = null;
    }

    if (scenario.id === "async") {
      const handle = quoterm({
        source: cardRef.current,
        variant: "info",
        command: scenario.command,
        title: "Indexing corpus",
        message: "Queued worker…",
        duration: 0,
        placement,
        theme,
      });
      asyncTimeoutRef.current = window.setTimeout(() => {
        asyncTimeoutRef.current = null;
        handle.update({ variant: "success", title: "Index complete", message: "1,284 chunks indexed.", duration });
      }, 1400);
    } else {
      quoterm({
        source: cardRef.current,
        variant: scenario.variant,
        command: scenario.command,
        title: scenario.title,
        message: scenario.message,
        duration,
        placement,
        theme,
      });
    }
  };

  return (
    <article ref={cardRef} className="scenario-card" aria-label={scenario.label}>
      <div className="scenario-info">
        <p className="eyebrow">{scenario.label}</p>
        <h2>{scenario.actionLabel}</h2>
        <p>{scenario.message}</p>
      </div>
      <div className="button-grid" aria-label={`${scenario.label} triggers`}>
        <button type="button" onClick={fireQuoterm}>
          Quoterm
        </button>
        <button type="button" onClick={() => showToastLibrary("hot", scenario)}>
          react-hot-toast
        </button>
        <button type="button" onClick={() => showToastLibrary("sonner", scenario)}>
          Sonner
        </button>
        <button type="button" onClick={() => showToastLibrary("toastify", scenario)}>
          React-Toastify
        </button>
        <button
          type="button"
          className="compare"
          onClick={() => {
            fireQuoterm();
            showToastLibrary("hot", scenario);
            showToastLibrary("sonner", scenario);
            showToastLibrary("toastify", scenario);
          }}
        >
          Compare all
        </button>
      </div>
    </article>
  );
}

function App() {
  const [placement, setPlacement] = React.useState<QuotermPlacement>("before");
  const [theme, setTheme] = React.useState<QuotermTheme>("dark");
  const [duration, setDuration] = React.useState(5000);

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">interactive comparison</p>
        <h1>Quoterm keeps feedback where the action happened.</h1>
        <p>
          Click any scenario to compare anchored Quoterm feedback against corner toasts from react-hot-toast, Sonner, and
          React-Toastify. Use "Compare all" to see them side-by-side.
        </p>

        <form className="playground-controls" aria-label="Quoterm controls">
          <label>
            Placement
            <select value={placement} onChange={(e) => setPlacement(e.currentTarget.value as QuotermPlacement)}>
              <option value="before">Before / above source</option>
              <option value="after">After / below source</option>
            </select>
          </label>
          <label>
            Theme
            <select value={theme} onChange={(e) => setTheme(e.currentTarget.value as QuotermTheme)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <label>
            Duration
            <select value={duration} onChange={(e) => setDuration(Number(e.currentTarget.value))}>
              <option value={5000}>Auto-dismiss 5s</option>
              <option value={0}>Persistent</option>
            </select>
          </label>
        </form>

        <div className="hero-actions">
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
      </section>

      <section className="scenario-grid" aria-label="Feedback scenarios">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} placement={placement} theme={theme} duration={duration} />
        ))}
      </section>

      <QuotermHost maxItems={6} theme={theme} />
      <HotToaster position="bottom-right" />
      <SonnerToaster position="top-right" richColors closeButton />
      <ToastContainer position="bottom-left" newestOnTop theme="colored" />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
