import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TierBadge from "./TierBadge";

describe("TierBadge", () => {
  it("renders the letter A for tier A", () => {
    render(<TierBadge value="A" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("applies emerald color class for tier A", () => {
    const { container } = render(<TierBadge value="A" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("emerald");
  });

  it("renders the letter B for tier B", () => {
    render(<TierBadge value="B" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies blue color class for tier B", () => {
    const { container } = render(<TierBadge value="B" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("blue");
  });

  it("renders the letter C for tier C", () => {
    render(<TierBadge value="C" />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("renders the letter D for tier D", () => {
    render(<TierBadge value="D" />);
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("falls back to gray for unknown tier", () => {
    const { container } = render(<TierBadge value="Z" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("gray");
  });

  it("renders a dot indicator", () => {
    const { container } = render(<TierBadge value="A" />);
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });
});
