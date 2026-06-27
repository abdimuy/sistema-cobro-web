import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TierRiesgoBadge from "./TierRiesgoBadge";

describe("TierRiesgoBadge", () => {
  it('renders "Al día" for AL_DIA', () => {
    render(<TierRiesgoBadge value="AL_DIA" />);
    expect(screen.getByText("Al día")).toBeInTheDocument();
  });

  it('renders "Vigilancia" for VIGILANCIA', () => {
    render(<TierRiesgoBadge value="VIGILANCIA" />);
    expect(screen.getByText("Vigilancia")).toBeInTheDocument();
  });

  it('renders "En riesgo" for EN_RIESGO', () => {
    render(<TierRiesgoBadge value="EN_RIESGO" />);
    expect(screen.getByText("En riesgo")).toBeInTheDocument();
  });

  it('renders "Crítico" for CRITICO', () => {
    render(<TierRiesgoBadge value="CRITICO" />);
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });

  it("renders the raw value as label for unknown tier", () => {
    render(<TierRiesgoBadge value="DESCONOCIDO" />);
    expect(screen.getByText("DESCONOCIDO")).toBeInTheDocument();
  });
});
