import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraKpiHero } from "./CarteraKpiHero";
import { makeFakeSaludCartera } from "../application/__tests__/fakeCarteraPort";

describe("CarteraKpiHero", () => {
  it("renders KPI labels", () => {
    render(<CarteraKpiHero salud={makeFakeSaludCartera()} />);
    expect(screen.getByText("PAR")).toBeInTheDocument();
    expect(screen.getByText("Tasa de cobranza")).toBeInTheDocument();
    expect(screen.getByText("Saldo total")).toBeInTheDocument();
    expect(screen.getByText("Cuentas en mora")).toBeInTheDocument();
    expect(screen.getByText("Margen real")).toBeInTheDocument();
  });

  it("formats ratios as percentages and money compactly", () => {
    render(
      <CarteraKpiHero
        salud={makeFakeSaludCartera({ par: "0.15", ceiRate: "0.82", saldoTotal: "500000.00" })}
      />,
    );
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText(/82%/)).toBeInTheDocument();
    expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
  });

  it("renders Margen real as money, not a percentage", () => {
    render(
      <CarteraKpiHero
        salud={makeFakeSaludCartera({ margenRealProxy: "63360.00" })}
      />,
    );
    // Must show currency-formatted value
    expect(screen.getByText(/63,360/)).toBeInTheDocument();
    // Must NOT show a percentage sign for the margen KPI
    const margenLabel = screen.getByText("Margen real");
    const kpiCell = margenLabel.closest("div[class]")!;
    expect(kpiCell.textContent).not.toMatch(/%/);
  });

  it("preserves sub-percent decimal precision for 4-decimal ratios", () => {
    render(
      <CarteraKpiHero
        salud={makeFakeSaludCartera({ par: "0.1523", ceiRate: "0.8750" })}
      />,
    );
    expect(screen.getByText("15.23%")).toBeInTheDocument();
    expect(screen.getByText("87.5%")).toBeInTheDocument();
  });

  it("applies the red semáforo when PAR is high", () => {
    render(<CarteraKpiHero salud={makeFakeSaludCartera({ par: "0.30" })} />);
    expect(screen.getByTestId("kpi-dot-red")).toBeInTheDocument();
  });

  it("applies the green semáforo when PAR is low", () => {
    render(<CarteraKpiHero salud={makeFakeSaludCartera({ par: "0.05" })} />);
    expect(screen.getAllByTestId("kpi-dot-green").length).toBeGreaterThan(0);
  });
});
