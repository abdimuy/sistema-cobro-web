import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BandaCreditoBadge from "./BandaCreditoBadge";

describe("BandaCreditoBadge", () => {
  it("renders 'Riesgo bajo' with green class for BAJO", () => {
    const { container } = render(<BandaCreditoBadge value="BAJO" />);
    expect(screen.getByText("Riesgo bajo")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/green/);
  });

  it("renders 'Riesgo medio' with amber class for MEDIO", () => {
    const { container } = render(<BandaCreditoBadge value="MEDIO" />);
    expect(screen.getByText("Riesgo medio")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/amber/);
  });

  it("renders 'Riesgo alto' with orange class for ALTO", () => {
    const { container } = render(<BandaCreditoBadge value="ALTO" />);
    expect(screen.getByText("Riesgo alto")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/orange/);
  });

  it("renders 'Riesgo crítico' with red class for CRITICO", () => {
    const { container } = render(<BandaCreditoBadge value="CRITICO" />);
    expect(screen.getByText("Riesgo crítico")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/red/);
  });

  it("renders nothing for empty string", () => {
    const { container } = render(<BandaCreditoBadge value="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for undefined", () => {
    const { container } = render(<BandaCreditoBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for unknown value", () => {
    const { container } = render(<BandaCreditoBadge value="DESCONOCIDO" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the dot span inside the badge", () => {
    const { container } = render(<BandaCreditoBadge value="BAJO" />);
    const spans = container.querySelectorAll("span");
    // outer span (badge) + inner span (dot)
    expect(spans.length).toBeGreaterThanOrEqual(2);
    const dotSpan = spans[1];
    expect(dotSpan.className).toMatch(/rounded-full/);
  });
});
