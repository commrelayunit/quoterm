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
  it("renders terminal-style feedback", () => {
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Saved", message: "Changes landed.", variant: "success", duration: 0 });
    });

    expect(screen.getByRole("status").textContent).toContain("Saved");
    expect(screen.getByText(/quoterm --success/)).toBeTruthy();
  });

  it("uses alert semantics for warnings and errors", () => {
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Careful", variant: "warning", duration: 0 });
    });

    expect(screen.getByRole("alert").textContent).toContain("Careful");
  });

  it("auto dismisses after duration", () => {
    vi.useFakeTimers();
    render(<QuotermHost />);

    act(() => {
      quoterm({ title: "Short-lived", duration: 100 });
    });
    expect(screen.getByText("Short-lived")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(screen.queryByText("Short-lived")).toBeNull();
  });
});
