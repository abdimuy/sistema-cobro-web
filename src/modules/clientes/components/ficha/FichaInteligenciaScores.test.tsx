import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaInteligenciaScores } from "./FichaInteligenciaScores";
import { clvDrivers } from "./clvDrivers";
import type { Pulso } from "../../domain/entities/FichaCliente";

function makePulso(overrides: Partial<Pulso> = {}): Pulso {
  const base: Pulso = {
    score: 75,
    segmento: "LEAL_POR_LIQUIDAR",
    estadoPago: "AL_CORRIENTE",
    recenciaDias: 30,
    frecuencia: 12,
    monetary: "85000.00",
    saldo: "13000.00",
    porLiquidarPct: "15.29",
    fechaUltimaCompra: new Date("2025-02-15T09:00:00Z"),
    fechaUltimoPago: new Date("2025-03-01T14:30:00Z"),
    nextBestProduct: "Comedor 6 personas",
    numPagos: 48,
    cadenciaDias: 30,
    diasAtrasoProm: 2,
    pctPagosATiempo: "94.68",
    fechaProxPago: new Date("2026-01-12T12:00:00Z"),
    montoProxPago: "4000.00",
    tierRiesgo: "AL_DIA",
    bandaCredito: "BAJO",
    scoreCredito: 91,
    creditoDrivers: ["pagos al corriente"],
    bandaRecompra: "MEDIA",
    scoreRecompra: 32,
    recompraDrivers: ["buen historial de pago", "tickets de mayor valor"],
    clv: "302.17",
    bandaClv: "MEDIO",
  };
  return { ...base, ...overrides };
}

describe("clvDrivers", () => {
  it("derives propensity, payment and ticket reasons", () => {
    const d = clvDrivers(
      makePulso({ bandaRecompra: "ALTA", bandaCredito: "BAJO", bandaClv: "ALTO" }),
    );
    expect(d).toContain("recompra recurrente esperada");
    expect(d).toContain("pagos confiables");
    expect(d).toContain("tickets de alto valor");
  });

  it("flags impago risk for a high-risk credit band", () => {
    const d = clvDrivers(makePulso({ bandaCredito: "CRITICO" }));
    expect(d).toContain("riesgo de impago");
  });

  it("falls back to estadoPago when there is no credit band", () => {
    const d = clvDrivers(
      makePulso({ bandaCredito: undefined, estadoPago: "LIQUIDADO" }),
    );
    expect(d).toContain("pagos confiables");
  });

  it("returns at most 3 reasons", () => {
    expect(clvDrivers(makePulso()).length).toBeLessThanOrEqual(3);
  });
});

describe("FichaInteligenciaScores", () => {
  it("renders nothing without pulso", () => {
    const { container } = render(<FichaInteligenciaScores pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all three score panels", () => {
    render(<FichaInteligenciaScores pulso={makePulso()} />);
    expect(screen.getByText("Riesgo de crédito")).toBeInTheDocument();
    expect(screen.getByText("Propensión a recompra")).toBeInTheDocument();
    expect(screen.getByText("Valor del cliente")).toBeInTheDocument();
  });

  it("renders section title and subtitle matching the mockup", () => {
    render(<FichaInteligenciaScores pulso={makePulso()} />);
    expect(screen.getByText("Inteligencia del cliente")).toBeInTheDocument();
    expect(screen.getByText("scores · explica el porqué")).toBeInTheDocument();
  });

  it("shows the band statement with the score on the right", () => {
    render(
      <FichaInteligenciaScores
        pulso={makePulso({ bandaRecompra: "MEDIA", scoreRecompra: 32 })}
      />,
    );
    // New wording: "MEDIA recompra" (not "Recompra media")
    expect(screen.getByText("MEDIA recompra")).toBeInTheDocument();
    expect(screen.getByText("32 / 100")).toBeInTheDocument();
  });

  it("renders a per-panel no-aplica placeholder", () => {
    render(
      <FichaInteligenciaScores pulso={makePulso({ bandaCredito: undefined })} />,
    );
    expect(screen.getByText("Sin saldo a crédito")).toBeInTheDocument();
    expect(screen.getByText("MEDIA recompra")).toBeInTheDocument();
  });

  it("surfaces the derived CLV drivers", () => {
    render(
      <FichaInteligenciaScores
        pulso={makePulso({
          bandaRecompra: "ALTA",
          bandaClv: "ALTO",
          bandaCredito: "BAJO",
        })}
      />,
    );
    expect(screen.getByText("tickets de alto valor")).toBeInTheDocument();
  });

  it("renders drivers as a bullet list (no ¿Por qué? heading)", () => {
    render(
      <FichaInteligenciaScores
        pulso={makePulso({ creditoDrivers: ["pagos al corriente"] })}
      />,
    );
    expect(screen.queryByText("¿Por qué?")).not.toBeInTheDocument();
    expect(screen.getByText("pagos al corriente")).toBeInTheDocument();
    // At least one driver list rendered
    const lists = screen.getAllByRole("list", { name: "Factores del score" });
    expect(lists.length).toBeGreaterThan(0);
  });

  it("renders recompra drivers as bullet list items", () => {
    render(
      <FichaInteligenciaScores
        pulso={makePulso({
          recompraDrivers: ["buen historial de pago", "tickets de mayor valor"],
        })}
      />,
    );
    expect(screen.getByText("buen historial de pago")).toBeInTheDocument();
    expect(screen.getByText("tickets de mayor valor")).toBeInTheDocument();
  });

  it("panel with undefined band shows empty placeholder, no driver lists", () => {
    render(
      <FichaInteligenciaScores
        pulso={makePulso({ bandaCredito: undefined, bandaRecompra: undefined, bandaClv: undefined, clv: undefined })}
      />,
    );
    expect(screen.queryByRole("list", { name: "Factores del score" })).not.toBeInTheDocument();
    expect(screen.getByText("Sin saldo a crédito")).toBeInTheDocument();
    const sinHistorial = screen.getAllByText("Sin historial de compras");
    expect(sinHistorial).toHaveLength(2);
  });
});
