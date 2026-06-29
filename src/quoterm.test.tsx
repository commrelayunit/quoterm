import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QuotermHost, dismissQuoterm, quoterm } from "./quoterm";

function clickSource() {
  return screen.getByRole("button", { name: "Source action" });
}

afterEach(() => {
  act(() => {
    dismissQuoterm();
  });
  vi.useRealTimers();
});

describe("quoterm", () => {
  it("renders source-bound feedback as a fixed overlay by default", () => {
    render(
      <div>
        <QuotermHost />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      quoterm({ source: clickSource(), title: "Saved", message: "Changes landed.", variant: "success", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    expect(feedback.textContent).toContain("> success: Saved");
    expect(feedback.textContent).toContain("Changes landed.");
    expect(feedback.parentElement?.dataset.quotermSlot).toBe("inline");
    expect(feedback.parentElement?.dataset.quotermPlacement).toBe("before");
    expect(feedback.parentElement?.dataset.quotermRenderMode).toBe("overlay");
    expect(feedback.parentElement?.classList.contains("quoterm-inline-slot")).toBe(true);
    expect(feedback.parentElement?.getAttribute("style") ?? "").toMatch(/position:\s*fixed/i);
    expect(clickSource().previousElementSibling).toBeNull();
    expect(document.querySelector(".quoterm-fallback-root")).toBeNull();
  });

  it("renders source-bound overlay feedback after the source element when requested without moving DOM siblings", () => {
    render(
      <div>
        <QuotermHost />
        <button type="button">Source action</button>
        <span data-testid="next-sibling">Next sibling</span>
      </div>,
    );

    act(() => {
      quoterm({ source: clickSource(), title: "Saved below", placement: "after", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    const slot = feedback.parentElement;
    expect(slot?.dataset.quotermSlot).toBe("inline");
    expect(slot?.dataset.quotermPlacement).toBe("after");
    expect(slot?.dataset.quotermRenderMode).toBe("overlay");
    expect(slot?.classList.contains("quoterm-inline-slot")).toBe(true);
    expect(clickSource().nextElementSibling).toBe(screen.getByTestId("next-sibling"));
    expect(slot?.getAttribute("style") ?? "").toMatch(/position:\s*fixed/i);
    expect(document.querySelector(".quoterm-fallback-root")).toBeNull();
  });

  it("inserts source-bound feedback before the source element in inline render mode", () => {
    render(
      <div>
        <QuotermHost renderMode="inline" />
        <button type="button">Source action</button>
      </div>,
    );

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    clickSource().getBoundingClientRect = () =>
      ({ left: 100, right: 220, top: 100, bottom: 132, width: 120, height: 32, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      quoterm({ source: clickSource(), title: "Inserted above", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    const slot = feedback.parentElement;
    expect(slot?.dataset.quotermSlot).toBe("inline");
    expect(slot?.dataset.quotermPlacement).toBe("before");
    expect(slot?.dataset.quotermRenderMode).toBe("inline");
    expect(clickSource().previousElementSibling).toBe(slot);
    expect(slot?.getAttribute("style") ?? "").not.toMatch(/position:\s*fixed/i);
    expect(slot?.getAttribute("style") ?? "").not.toMatch(/left:\s*/i);
    expect(slot?.getAttribute("style") ?? "").not.toMatch(/top:\s*/i);
  });

  it("inserts source-bound feedback after the source element in inline render mode", () => {
    render(
      <div>
        <QuotermHost renderMode="inline" />
        <button type="button">Source action</button>
        <span data-testid="next-sibling">Next sibling</span>
      </div>,
    );

    act(() => {
      quoterm({ source: clickSource(), title: "Inserted below", placement: "below", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    const slot = feedback.parentElement;
    expect(slot?.dataset.quotermPlacement).toBe("after");
    expect(slot?.dataset.quotermRenderMode).toBe("inline");
    expect(clickSource().nextElementSibling).toBe(slot);
    expect(slot?.nextElementSibling).toBe(screen.getByTestId("next-sibling"));
    expect(slot?.getAttribute("style") ?? "").not.toMatch(/position:\s*fixed/i);
  });

  it("accepts bottom and below as after-placement aliases", () => {
    render(
      <div>
        <QuotermHost maxItems={2} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Bottom alias", placement: "bottom", duration: 0 });
      quoterm({ source, title: "Below alias", placement: "below", duration: 0 });
    });

    expect(screen.getByText(/Bottom alias/).closest("section")?.parentElement?.dataset.quotermPlacement).toBe("after");
    expect(screen.getByText(/Below alias/).closest("section")?.parentElement?.dataset.quotermPlacement).toBe("after");
  });

  it("formats each visible severity as a compact prompt line with a colorable prompt marker", () => {
    render(
      <div>
        <QuotermHost maxItems={4} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Saved", variant: "success", duration: 0 });
      quoterm({ source, title: "Review", variant: "warning", duration: 0 });
      quoterm({ source, title: "Failed", variant: "error", duration: 0 });
      quoterm({ source, title: "Queued", variant: "info", duration: 0 });
    });

    expect(screen.getByText(/success:/).closest("section")?.textContent).toContain("> success: Saved");
    expect(screen.getByText(/warning:/).closest("section")?.textContent).toContain("> warning: Review");
    expect(screen.getByText(/error:/).closest("section")?.textContent).toContain("> error: Failed");
    expect(screen.getByText(/info:/).closest("section")?.textContent).toContain("> info: Queued");
    expect(document.querySelectorAll(".quoterm__prompt")).toHaveLength(4);
  });

  it("can hide terminal command and prompt chrome at the host level", () => {
    render(
      <div>
        <QuotermHost showCommandChrome={false} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      quoterm({
        source: clickSource(),
        title: "Feedback only",
        variant: "error",
        command: "refhub feedback --error",
        duration: 0,
      });
    });

    const feedback = screen.getByRole("alert");
    expect(feedback.textContent).toContain("Feedback only");
    expect(feedback.textContent).not.toContain("$ refhub feedback --error");
    expect(feedback.textContent).not.toContain("> error:");
    expect(feedback.querySelector(".quoterm__command")).toBeNull();
    expect(feedback.querySelector(".quoterm__prompt")).toBeNull();
    expect(feedback.querySelector(".quoterm__variant")).toBeNull();
  });

  it("uses alert semantics for warnings and errors", () => {
    render(
      <div>
        <QuotermHost />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      quoterm({ source: clickSource(), title: "Careful", variant: "warning", duration: 0 });
    });

    expect(screen.getByRole("alert").textContent).toContain("> warning: Careful");
  });

  it("auto dismisses after a positive duration", () => {
    vi.useFakeTimers();
    render(
      <div>
        <QuotermHost />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      quoterm({ source: clickSource(), title: "Short-lived", duration: 100 });
    });
    expect(screen.getByText(/Short-lived/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(screen.queryByText(/Short-lived/)).toBeNull();
  });

  it("auto dismisses success and info by default", () => {
    vi.useFakeTimers();
    render(
      <div>
        <QuotermHost maxItems={2} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Default success", id: "default-success" });
      quoterm({ source, title: "Default info", id: "default-info", variant: "info" });
    });

    act(() => {
      vi.advanceTimersByTime(4001);
    });
    expect(screen.queryByText(/Default success/)).toBeNull();
    expect(screen.getByText(/Default info/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/Default info/)).toBeNull();
  });

  it("persists warnings, errors, and explicit null or zero durations", () => {
    vi.useFakeTimers();
    render(
      <div>
        <QuotermHost maxItems={4} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Default warning", id: "default-warning", variant: "warning" });
      quoterm({ source, title: "Default error", id: "default-error", variant: "error" });
      quoterm({ source, title: "Null duration", id: "null-duration", duration: null });
      quoterm({ source, title: "Zero duration", id: "zero-duration", duration: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText(/Default warning/)).toBeTruthy();
    expect(screen.getByText(/Default error/)).toBeTruthy();
    expect(screen.getByText(/Null duration/)).toBeTruthy();
    expect(screen.getByText(/Zero duration/)).toBeTruthy();
  });

  it("uses a host min width for inline feedback anchored to narrow source elements", () => {
    render(
      <div>
        <QuotermHost minWidth={280} maxWidth={360} />
        <button type="button">Source action</button>
      </div>,
    );

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    clickSource().getBoundingClientRect = () =>
      ({ left: 40, right: 120, top: 100, bottom: 132, width: 80, height: 32, x: 40, y: 100, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      quoterm({ source: clickSource(), title: "Wide enough", duration: 0 });
    });

    const slot = screen.getByRole("status").parentElement;
    expect(slot?.getAttribute("style") ?? "").toMatch(/width:\s*280px/i);
    expect(slot?.getAttribute("style") ?? "").toMatch(/left:\s*16px/i);
  });


  it("scales inline feedback width from the source width by default", () => {
    render(
      <div>
        <QuotermHost />
        <button type="button">Source action</button>
      </div>,
    );

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    clickSource().getBoundingClientRect = () =>
      ({ left: 100, right: 220, top: 100, bottom: 132, width: 120, height: 32, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      quoterm({ source: clickSource(), title: "Scaled from source", duration: 0 });
    });

    const slot = screen.getByRole("status").parentElement;
    expect(slot?.getAttribute("style") ?? "").toMatch(/width:\s*300px/i);
  });

  it("accepts configured inline width min, max, and source scale", () => {
    render(
      <div>
        <QuotermHost inlineWidth={{ min: 280, max: 420, sourceScale: 2.5 }} />
        <button type="button">Source action</button>
      </div>,
    );

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    clickSource().getBoundingClientRect = () =>
      ({ left: 200, right: 400, top: 100, bottom: 132, width: 200, height: 32, x: 200, y: 100, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      quoterm({ source: clickSource(), title: "Configured scaling", duration: 0 });
    });

    const slot = screen.getByRole("status").parentElement;
    expect(slot?.getAttribute("style") ?? "").toMatch(/width:\s*420px/i);
  });

  it("clamps configured inline width to narrow viewports", () => {
    render(
      <div>
        <QuotermHost gutter={16} inlineWidth={{ min: 280, max: 420, sourceScale: 2.5 }} />
        <button type="button">Source action</button>
      </div>,
    );

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 300 });
    clickSource().getBoundingClientRect = () =>
      ({ left: 40, right: 120, top: 100, bottom: 132, width: 80, height: 32, x: 40, y: 100, toJSON: () => ({}) }) as DOMRect;

    act(() => {
      quoterm({ source: clickSource(), title: "Viewport clamped", duration: 0 });
    });

    const slot = screen.getByRole("status").parentElement;
    expect(slot?.getAttribute("style") ?? "").toMatch(/width:\s*268px/i);
    expect(slot?.getAttribute("style") ?? "").toMatch(/left:\s*16px/i);
  });

  it("keeps a minimal fallback only when no source element is available", () => {
    render(<QuotermHost />);

    act(() => {
      quoterm({ source: null, title: "Global note", variant: "info", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    expect(feedback.textContent).toContain("> info: Global note");
    expect(feedback.closest(".quoterm-fallback-root")).toBeTruthy();
  });


  it("supports host and per-message themes", () => {
    render(
      <div>
        <QuotermHost theme="dark" maxItems={2} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Host theme", id: "host-theme", duration: 0 });
      quoterm({ source, title: "Light override", id: "light-theme", theme: "light", duration: 0 });
    });

    const hostTheme = screen.getByText(/Host theme/).closest("section");
    const lightTheme = screen.getByText(/Light override/).closest("section");
    expect(hostTheme?.dataset.theme).toBe("dark");
    expect(lightTheme?.dataset.theme).toBe("light");
  });
});
