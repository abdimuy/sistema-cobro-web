import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeterioroChip } from "./DeterioroChip";
import { makeFakeRollRate } from "../application/__tests__/fakeCarteraPort";

describe("DeterioroChip", () => {
  it("shows 'Acumulando datos' when not available", () => {
    render(<DeterioroChip rollRate={makeFakeRollRate({ disponible: false })} />);
    expect(screen.getByText(/acumulando datos/i)).toBeInTheDocument();
  });

  it("shows deterioro with the value when roll rate is positive", () => {
    render(<DeterioroChip rollRate={makeFakeRollRate({ disponible: true, rollRate: 0.08 })} />);
    expect(screen.getByText(/deterioro/i)).toBeInTheDocument();
    expect(screen.getByText(/\+8%/)).toBeInTheDocument();
  });

  it("shows mejora when roll rate is negative", () => {
    render(<DeterioroChip rollRate={makeFakeRollRate({ disponible: true, rollRate: -0.05 })} />);
    expect(screen.getByText(/mejora/i)).toBeInTheDocument();
    expect(screen.getByText(/-5%/)).toBeInTheDocument();
  });
});
