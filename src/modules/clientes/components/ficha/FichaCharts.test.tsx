import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaCharts } from "./FichaCharts";
import type { PuntoCompradoAbonado } from "../../domain/entities/FichaCliente";

const compradoAbonado: PuntoCompradoAbonado[] = [
  { anio: 2025, mes: 1, comprado: "5000", abonado: "1000" },
  { anio: 2025, mes: 2, comprado: "0", abonado: "2000" },
];

describe("FichaCharts", () => {
  it("renders the comparativa chart section title", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument();
  });

  it("renders a legend for both series", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.getByText("Comprado")).toBeInTheDocument();
    expect(screen.getByText("Abonado")).toBeInTheDocument();
  });

  it("does not render the removed Abonos por mes chart", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.queryByText("Abonos por mes")).not.toBeInTheDocument();
  });
});
