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
  it("renders source-bound feedback immediately before the source element in DOM flow", () => {
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
    expect(clickSource().previousElementSibling).toBe(feedback.parentElement);
    expect(feedback.getAttribute("style") ?? "").not.toMatch(/top|left|position/i);
    expect(document.querySelector(".quoterm-fallback-root")).toBeNull();
  });

  it("formats each visible severity as a compact prompt line", () => {
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

  it("persists when duration is undefined, null, or zero", () => {
    vi.useFakeTimers();
    render(
      <div>
        <QuotermHost maxItems={3} />
        <button type="button">Source action</button>
      </div>,
    );

    act(() => {
      const source = clickSource();
      quoterm({ source, title: "Undefined duration", id: "undefined-duration" });
      quoterm({ source, title: "Null duration", id: "null-duration", duration: null });
      quoterm({ source, title: "Zero duration", id: "zero-duration", duration: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText(/Undefined duration/)).toBeTruthy();
    expect(screen.getByText(/Null duration/)).toBeTruthy();
    expect(screen.getByText(/Zero duration/)).toBeTruthy();
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
