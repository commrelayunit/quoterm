import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QuotermHost, dismissQuoterm, quoterm } from "./quoterm";

afterEach(() => {
  act(() => {
    dismissQuoterm();
  });
  vi.useRealTimers();
});

describe("quoterm", () => {
  it("renders compact terminal-style quote feedback", () => {
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Saved", message: "Changes landed.", variant: "success", duration: 0 });
    });

    const feedback = screen.getByRole("status");
    expect(feedback.textContent).toContain("> success: Saved");
    expect(feedback.textContent).toContain("Changes landed.");
  });

  it("uses alert semantics for warnings and errors", () => {
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Careful", variant: "warning", duration: 0 });
    });

    expect(screen.getByRole("alert").textContent).toContain("Careful");
  });

  it("auto dismisses after a positive duration", () => {
    vi.useFakeTimers();
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Short-lived", duration: 100 });
    });
    expect(screen.getByText(/Short-lived/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(screen.queryByText(/Short-lived/)).toBeNull();
  });

  it("persists when duration is undefined, null, or zero", () => {
    vi.useFakeTimers();
    render(<QuotermHost maxItems={3} />);

    act(() => {
      quoterm({ title: "Undefined duration", id: "undefined-duration" });
      quoterm({ title: "Null duration", id: "null-duration", duration: null });
      quoterm({ title: "Zero duration", id: "zero-duration", duration: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText(/Undefined duration/)).toBeTruthy();
    expect(screen.getByText(/Null duration/)).toBeTruthy();
    expect(screen.getByText(/Zero duration/)).toBeTruthy();
  });
});
