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
type Library = "quoterm" | "hot" | "sonner" | "toastify" | "all";

interface Scenario {
  id: string;
  label: string;
  variant: Variant;
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
    message: "Quoterm can update in place; toasts usually stack progress elsewhere.",
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

const variantEmoji: Record<Variant, string> = {
  success: "✅",
  warning: "⚠️",
  error: "🛑",
  info: "ℹ️",
};

function showToastLibrary(library: Exclude<Library, "quoterm" | "all">, scenario: Scenario) {
  const text = `${scenario.title}: ${scenario.message}`;

  if (library === "hot") {
    if (scenario.variant === "success") hotToast.success(text);
    else if (scenario.variant === "error") hotToast.error(text);
    else hotToast(text, { icon: variantEmoji[scenario.variant] });
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

function fireScenario(event: React.MouseEvent<HTMLButtonElement>, scenario: Scenario, library: Library) {
  if (library === "quoterm" || library === "all") {
    if (scenario.id === "async") {
      const feedback = quoterm({
        source: event.currentTarget,
        variant: "info",
        command: scenario.command,
        title: "Indexing corpus",
        message: "Queued worker…",
        duration: 0,
      });
      window.setTimeout(() => feedback.update({ variant: "success", title: "Index complete", message: "1,284 chunks indexed." }), 1200);
    } else {
      quoterm({
        source: event.currentTarget,
        variant: scenario.variant,
        command: scenario.command,
        title: scenario.title,
        message: scenario.message,
        duration: 0,
      });
    }
  }

  if (library === "all") {
    showToastLibrary("hot", scenario);
    showToastLibrary("sonner", scenario);
    showToastLibrary("toastify", scenario);
    return;
  }

  if (library !== "quoterm") showToastLibrary(library, scenario);
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <article className="scenario-card">
      <div>
        <p className="eyebrow">{scenario.label}</p>
        <h2>{scenario.actionLabel}</h2>
        <p>{scenario.message}</p>
      </div>
      <div className="button-grid" aria-label={`${scenario.label} feedback triggers`}>
        <button type="button" onClick={(event) => fireScenario(event, scenario, "quoterm")}>
          Quoterm near control
        </button>
        <button type="button" onClick={(event) => fireScenario(event, scenario, "hot")}>
          react-hot-toast
        </button>
        <button type="button" onClick={(event) => fireScenario(event, scenario, "sonner")}>
          Sonner
        </button>
        <button type="button" onClick={(event) => fireScenario(event, scenario, "toastify")}>
          React-Toastify
        </button>
        <button className="compare" type="button" onClick={(event) => fireScenario(event, scenario, "all")}>
          Compare all
        </button>
      </div>
    </article>
  );
}

function App() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Interactive comparison app</p>
        <h1>Quoterm keeps feedback where the action happened.</h1>
        <p>
          Click any scenario to compare anchored Quoterm feedback against corner/global toasts from common React toast libraries.
          Use the “Compare all” buttons for screenshot and GIF capture.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={() => dismissQuoterm()}>
            Clear Quoterm feedback
          </button>
          <button
            type="button"
            onClick={() => {
              hotToast.dismiss();
              sonnerToast.dismiss();
              toastify.dismiss();
            }}
          >
            Clear toast libraries
          </button>
        </div>
      </section>

      <section className="capture-notes" aria-labelledby="capture-heading">
        <h2 id="capture-heading">Capture points</h2>
        <ul>
          <li>Click “Quoterm near control” to capture contextual placement.</li>
          <li>Click “Compare all” to capture Quoterm versus detached corner toasts.</li>
          <li>Use Success, Warning, Error, Async, Validation, and Destructive scenarios for README media.</li>
        </ul>
      </section>

      <section className="scenario-grid" aria-label="Feedback scenarios">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </section>

      <QuotermHost maxItems={6} />
      <HotToaster position="bottom-right" />
      <SonnerToaster position="top-right" richColors closeButton />
      <ToastContainer position="bottom-left" newestOnTop theme="colored" />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
