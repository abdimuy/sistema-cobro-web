import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EstadoPagoBadge from "./EstadoPagoBadge";

describe("EstadoPagoBadge", () => {
  it("renders the humanized label for AL_CORRIENTE", () => {
    render(<EstadoPagoBadge value="AL_CORRIENTE" />);
    expect(screen.getByText("Al corriente")).toBeInTheDocument();
  });

  it("applies green/emerald color class for AL_CORRIENTE", () => {
    const { container } = render(<EstadoPagoBadge value="AL_CORRIENTE" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("emerald");
  });

  it("renders the humanized label for MOROSO", () => {
    render(<EstadoPagoBadge value="MOROSO" />);
    expect(screen.getByText("Moroso")).toBeInTheDocument();
  });

  it("applies red color class for MOROSO", () => {
    const { container } = render(<EstadoPagoBadge value="MOROSO" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("red");
  });

  it("renders the humanized label for ATRASADO", () => {
    render(<EstadoPagoBadge value="ATRASADO" />);
    expect(screen.getByText("Atrasado")).toBeInTheDocument();
  });

  it("applies amber color class for ATRASADO", () => {
    const { container } = render(<EstadoPagoBadge value="ATRASADO" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("amber");
  });

  it("renders LIQUIDADO label", () => {
    render(<EstadoPagoBadge value="LIQUIDADO" />);
    expect(screen.getByText("Liquidado")).toBeInTheDocument();
  });

  it("renders SIN_CREDITO label", () => {
    render(<EstadoPagoBadge value="SIN_CREDITO" />);
    expect(screen.getByText("Sin crédito")).toBeInTheDocument();
  });

  it("applies gray fallback for unknown value", () => {
    const { container } = render(<EstadoPagoBadge value="UNKNOWN_STATE" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("gray");
    // Should show raw value as label
    expect(screen.getByText("UNKNOWN_STATE")).toBeInTheDocument();
  });

  it("renders a dot indicator", () => {
    const { container } = render(<EstadoPagoBadge value="MOROSO" />);
    // The inner dot span
    const spans = container.querySelectorAll("span");
    // outer span + dot span = at least 2
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });
});
