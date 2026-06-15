import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SegmentoBadge from "./SegmentoBadge";

describe("SegmentoBadge", () => {
  it("renders humanized label for DORMIDO_VALIOSO", () => {
    render(<SegmentoBadge value="DORMIDO_VALIOSO" />);
    expect(screen.getByText("Dormido valioso")).toBeInTheDocument();
  });

  it("applies violet color class for DORMIDO_VALIOSO", () => {
    const { container } = render(<SegmentoBadge value="DORMIDO_VALIOSO" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("violet");
  });

  it("renders humanized label for LEAL_POR_LIQUIDAR", () => {
    render(<SegmentoBadge value="LEAL_POR_LIQUIDAR" />);
    expect(screen.getByText("Leal por liquidar")).toBeInTheDocument();
  });

  it("applies teal color class for LEAL_POR_LIQUIDAR", () => {
    const { container } = render(<SegmentoBadge value="LEAL_POR_LIQUIDAR" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("teal");
  });

  it("renders ACTIVO label", () => {
    render(<SegmentoBadge value="ACTIVO" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders NUEVO label", () => {
    render(<SegmentoBadge value="NUEVO" />);
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
  });

  it("renders FRIO label", () => {
    render(<SegmentoBadge value="FRIO" />);
    expect(screen.getByText("Frío")).toBeInTheDocument();
  });

  it("renders PERDIDO label", () => {
    render(<SegmentoBadge value="PERDIDO" />);
    expect(screen.getByText("Perdido")).toBeInTheDocument();
  });

  it("falls back to gray with raw value as label for unknown segmento", () => {
    const { container } = render(<SegmentoBadge value="DESCONOCIDO" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("gray");
    expect(screen.getByText("DESCONOCIDO")).toBeInTheDocument();
  });

  it("renders a dot indicator", () => {
    const { container } = render(<SegmentoBadge value="ACTIVO" />);
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });
});
