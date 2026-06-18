import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaCharts } from "./FichaCharts";
import type {
  PuntoMensual,
  PuntoCompradoAbonado,
} from "../../domain/entities/FichaCliente";

const abonos: PuntoMensual[] = [
  { anio: 2025, mes: 1, monto: "1000" },
  { anio: 2025, mes: 2, monto: "2000" },
];

const compradoAbonado: PuntoCompradoAbonado[] = [
  { anio: 2025, mes: 1, comprado: "5000", abonado: "1000" },
  { anio: 2025, mes: 2, comprado: "0", abonado: "2000" },
];

describe("FichaCharts", () => {
  it("renders a legend for both series in the comparativa chart", () => {
    render(
      <FichaCharts abonosPorMes={abonos} compradoVsAbonado={compradoAbonado} />,
    );
    // "Comprado" only labels the comparativa legend.
    expect(screen.getByText("Comprado")).toBeInTheDocument();
    // "Abonado" labels both legends (abonos chart + comparativa chart).
    expect(screen.getAllByText("Abonado").length).toBeGreaterThanOrEqual(2);
  });

  it("renders both chart section titles", () => {
    render(
      <FichaCharts abonosPorMes={abonos} compradoVsAbonado={compradoAbonado} />,
    );
    expect(screen.getByText("Abonos por mes")).toBeInTheDocument();
    expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument();
  });
});
