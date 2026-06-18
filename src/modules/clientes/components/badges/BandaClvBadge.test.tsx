import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BandaClvBadge from "./BandaClvBadge";

describe("BandaClvBadge", () => {
  it("renders 'CLV alto' with green class for ALTO", () => {
    const { container } = render(<BandaClvBadge banda="ALTO" />);
    expect(screen.getByText("CLV alto")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/green/);
  });

  it("renders 'CLV medio' with amber class for MEDIO", () => {
    const { container } = render(<BandaClvBadge banda="MEDIO" />);
    expect(screen.getByText("CLV medio")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/amber/);
  });

  it("renders 'CLV bajo' with gray class for BAJO", () => {
    const { container } = render(<BandaClvBadge banda="BAJO" />);
    expect(screen.getByText("CLV bajo")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/gray/);
  });

  it("renders nothing for empty banda", () => {
    const { container } = render(<BandaClvBadge banda="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for undefined banda", () => {
    const { container } = render(<BandaClvBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for unknown banda value", () => {
    const { container } = render(<BandaClvBadge banda="DESCONOCIDO" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders formatted monto when clv is provided", () => {
    render(<BandaClvBadge banda="ALTO" clv="8204.83" />);
    // formatMoneyShort("8204.83") → "$8,205" in es-MX locale
    const badge = screen.getByText(/CLV alto/);
    expect(badge.textContent).toMatch(/\$8[,.]?205/);
  });

  it("renders label without monto when clv is not provided", () => {
    render(<BandaClvBadge banda="MEDIO" />);
    expect(screen.getByText("CLV medio")).toBeInTheDocument();
  });

  it("renders the dot span inside the badge", () => {
    const { container } = render(<BandaClvBadge banda="ALTO" />);
    const spans = container.querySelectorAll("span");
    // outer span (badge) + inner span (dot)
    expect(spans.length).toBeGreaterThanOrEqual(2);
    const dotSpan = spans[1];
    expect(dotSpan.className).toMatch(/rounded-full/);
  });
});
