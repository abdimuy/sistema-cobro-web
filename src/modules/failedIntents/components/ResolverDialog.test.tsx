import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ResolverDialog } from "./ResolverDialog";

describe("ResolverDialog", () => {
  it("starts at `ignored` by default", () => {
    const onSubmit = vi.fn();
    render(
      <ResolverDialog
        open
        pending={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByTestId("resolver-submit"));
    expect(onSubmit).toHaveBeenCalledWith({ status: "ignored", notes: "" });
  });

  it("switches status to resolved_manual when that option is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <ResolverDialog
        open
        pending={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/resuelto manualmente/i));
    fireEvent.click(screen.getByTestId("resolver-submit"));
    expect(onSubmit).toHaveBeenCalledWith({
      status: "resolved_manual",
      notes: "",
    });
  });

  it("counter changes color and submit is disabled when notes > 500 runes", () => {
    const onSubmit = vi.fn();
    render(
      <ResolverDialog
        open
        pending={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    const ta = screen.getByPlaceholderText(/por qué se está cerrando/i);
    fireEvent.change(ta, { target: { value: "a".repeat(501) } });
    expect(screen.getByTestId("notes-counter").textContent).toBe("501/500");
    expect(screen.getByTestId("resolver-submit")).toBeDisabled();
  });

  it("disables submit and cancel when pending", () => {
    render(
      <ResolverDialog
        open
        pending
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByTestId("resolver-submit")).toBeDisabled();
  });
});
