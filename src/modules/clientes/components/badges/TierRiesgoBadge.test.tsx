import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TierRiesgoBadge from "./TierRiesgoBadge";

describe("TierRiesgoBadge", () => {
  it("renders 'Al día' with green class for AL_DIA", () => {
    const { container } = render(<TierRiesgoBadge value="AL_DIA" />);
    expect(screen.getByText("Al día")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/green/);
  });

  it("renders 'Vigilancia' with amber class for VIGILANCIA", () => {
    const { container } = render(<TierRiesgoBadge value="VIGILANCIA" />);
    expect(screen.getByText("Vigilancia")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/amber/);
  });

  it("renders 'En riesgo' with orange class for EN_RIESGO", () => {
    const { container } = render(<TierRiesgoBadge value="EN_RIESGO" />);
    expect(screen.getByText("En riesgo")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/orange/);
  });

  it("renders 'Crítico' with red class for CRITICO", () => {
    const { container } = render(<TierRiesgoBadge value="CRITICO" />);
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/red/);
  });

  it("renders with gray fallback for unknown value", () => {
    const { container } = render(<TierRiesgoBadge value="DESCONOCIDO" />);
    // Falls back to the raw value as label
    expect(screen.getByText("DESCONOCIDO")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/gray/);
  });

  it("renders the dot span inside the badge", () => {
    const { container } = render(<TierRiesgoBadge value="AL_DIA" />);
    // The outer badge span contains an inner dot span
    const spans = container.querySelectorAll("span");
    // outer span (badge) + inner span (dot)
    expect(spans.length).toBeGreaterThanOrEqual(2);
    const dotSpan = spans[1];
    expect(dotSpan.className).toMatch(/rounded-full/);
  });
});
