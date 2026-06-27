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

  it("applies the red semáforo when PAR is high", () => {
    render(<CarteraKpiHero salud={makeFakeSaludCartera({ par: "0.30" })} />);
    expect(screen.getByTestId("kpi-dot-red")).toBeInTheDocument();
  });

  it("applies the green semáforo when PAR is low", () => {
    render(<CarteraKpiHero salud={makeFakeSaludCartera({ par: "0.05" })} />);
    expect(screen.getAllByTestId("kpi-dot-green").length).toBeGreaterThan(0);
  });
});
