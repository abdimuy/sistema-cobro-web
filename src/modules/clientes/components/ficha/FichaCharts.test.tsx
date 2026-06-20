import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaCharts } from "./FichaCharts";
import { buildCompradoAbonadoSpine } from "./lib/compradoAbonadoSpine";
import { categoriaMeta } from "../lib/pagoConcepto";
import type { PuntoCompradoAbonado } from "../../domain/entities/FichaCliente";

function punto(
  anio: number,
  mes: number,
  over: Partial<PuntoCompradoAbonado> = {},
): PuntoCompradoAbonado {
  return {
    anio,
    mes,
    comprado: "0",
    cobranza: "0",
    enganche: "0",
    condonacion: "0",
    perdida: "0",
    otro: "0",
    ...over,
  };
}

const compradoAbonado: PuntoCompradoAbonado[] = [
  punto(2025, 1, { comprado: "5000", cobranza: "1000" }),
  punto(2025, 2, { cobranza: "2000", condonacion: "900" }),
];

describe("FichaCharts", () => {
  it("renders the comparativa chart section title", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument();
  });

  it("renders a legend by category plus the purchase marker", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.getByText("Cobranza")).toBeInTheDocument();
    expect(screen.getByText("Condonación")).toBeInTheDocument();
    expect(screen.getByText("Mal cliente/fuga")).toBeInTheDocument();
    expect(screen.getByText("Compra")).toBeInTheDocument();
    // The old single-series legend is gone.
    expect(screen.queryByText("Abonado")).not.toBeInTheDocument();
  });

  it("paints the condonación legend dot violet, not green", () => {
    // jsdom normalises any CSS color to rgb(); normalise both sides the same way.
    const asRgb = (color: string): string => {
      const el = document.createElement("span");
      el.style.backgroundColor = color;
      return el.style.backgroundColor;
    };
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    const dot = screen
      .getByText("Condonación")
      .querySelector("span") as HTMLElement;
    expect(dot.style.backgroundColor).toBe(
      asRgb(categoriaMeta("condonacion").color),
    );
    expect(dot.style.backgroundColor).not.toBe(asRgb(categoriaMeta("pago").color));
  });

  it("does not render the removed Abonos por mes chart", () => {
    render(<FichaCharts compradoVsAbonado={compradoAbonado} />);
    expect(screen.queryByText("Abonos por mes")).not.toBeInTheDocument();
  });
});

describe("buildCompradoAbonadoSpine", () => {
  const today = new Date(2025, 5, 15); // jun 2025

  it("always returns 24 months ending in the month of `today`", () => {
    const spine = buildCompradoAbonadoSpine([], today);
    expect(spine).toHaveLength(24);
    expect(spine[23].anio).toBe(2025);
    expect(spine[23].mes).toBe(6);
    // 24 months back from jun 2025 inclusive → starts jul 2023.
    expect(spine[0].anio).toBe(2023);
    expect(spine[0].mes).toBe(7);
  });

  it("keeps the buckets of a month that has data", () => {
    const data = [
      punto(2024, 3, {
        comprado: "7000",
        cobranza: "1500",
        condonacion: "500",
      }),
    ];
    const spine = buildCompradoAbonadoSpine(data, today);
    const mar = spine.find((p) => p.anio === 2024 && p.mes === 3)!;
    expect(mar.comprado).toBe(7000);
    expect(mar.cobranza).toBe(1500);
    expect(mar.condonacion).toBe(500);
    expect(mar.abonadoTotal).toBe(2000);
  });

  it("fills recent months without data with zero so they still appear", () => {
    const data = [punto(2024, 1, { cobranza: "1000" })];
    const spine = buildCompradoAbonadoSpine(data, today);
    const last = spine[23];
    expect(last.mes).toBe(6);
    expect(last.anio).toBe(2025);
    expect(last.comprado).toBe(0);
    expect(last.abonadoTotal).toBe(0);
  });
});
