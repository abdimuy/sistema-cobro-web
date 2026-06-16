import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaCobranzaCards } from "./FichaCobranzaCards";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Fixtures ────────────────────────────────────────────────────────────────

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
  };
  return { ...base, ...overrides };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FichaCobranzaCards", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(<FichaCobranzaCards pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  describe("populated pulso", () => {
    it("renders section heading 'Cobranza'", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(screen.getByText("Cobranza")).toBeInTheDocument();
    });

    it("renders pct a tiempo prominently (Puntualidad card)", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      // 94.68 → "94.7%"
      expect(screen.getByText("94.7%")).toBeInTheDocument();
    });

    it("renders atraso prom stat", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(screen.getByText("2 días")).toBeInTheDocument();
    });

    it("renders cadencia stat", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(screen.getByText("30 días")).toBeInTheDocument();
    });

    it("renders total pagos stat", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(screen.getByText("48")).toBeInTheDocument();
    });

    it("renders tier riesgo badge (Riesgo card)", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      // TierRiesgoBadge label for AL_DIA
      expect(screen.getByText("Al día")).toBeInTheDocument();
    });

    it("renders tier description text", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(
        screen.getByText("Al corriente con sus pagos"),
      ).toBeInTheDocument();
    });

    it("renders fecha prox pago formatted (Próximo pago card)", () => {
      // 2026-01-12 → "12 ene 2026"
      render(<FichaCobranzaCards pulso={makePulso()} />);
      expect(screen.getByText(/12 ene 2026/i)).toBeInTheDocument();
    });

    it("renders monto prox pago formatted as MXN", () => {
      render(<FichaCobranzaCards pulso={makePulso()} />);
      // $4,000.00 — locale may render $4,000 or $4.000
      expect(screen.getByText(/\$4[.,]000/i)).toBeInTheDocument();
    });
  });

  describe("empty states — no-cadence client (numPagos=0, fechaProxPago=null)", () => {
    const noCadencePulso = makePulso({
      numPagos: 0,
      cadenciaDias: 0,
      diasAtrasoProm: 0,
      pctPagosATiempo: "",
      fechaProxPago: null,
      montoProxPago: "0.00",
      tierRiesgo: "",
    });

    it("renders 'Sin historial de pagos' in Puntualidad card", () => {
      render(<FichaCobranzaCards pulso={noCadencePulso} />);
      expect(
        screen.getByText("Sin historial de pagos"),
      ).toBeInTheDocument();
    });

    it("renders 'Sin clasificación' in Riesgo card when tierRiesgo is empty", () => {
      render(<FichaCobranzaCards pulso={noCadencePulso} />);
      expect(screen.getByText("Sin clasificación")).toBeInTheDocument();
    });

    it("renders 'Sin pago programado' in Próximo pago card", () => {
      render(<FichaCobranzaCards pulso={noCadencePulso} />);
      expect(screen.getByText("Sin pago programado")).toBeInTheDocument();
    });
  });

  describe("VIGILANCIA tier", () => {
    it("shows 'Algunos retrasos recientes' description", () => {
      render(<FichaCobranzaCards pulso={makePulso({ tierRiesgo: "VIGILANCIA" })} />);
      expect(
        screen.getByText("Algunos retrasos recientes"),
      ).toBeInTheDocument();
    });
  });

  describe("EN_RIESGO tier", () => {
    it("shows 'Historial de retrasos frecuentes' description", () => {
      render(
        <FichaCobranzaCards
          pulso={makePulso({ tierRiesgo: "EN_RIESGO" })}
        />,
      );
      expect(
        screen.getByText("Historial de retrasos frecuentes"),
      ).toBeInTheDocument();
    });
  });

  describe("CRITICO tier", () => {
    it("shows 'Dejó de abonar / saldo en riesgo' description", () => {
      render(
        <FichaCobranzaCards pulso={makePulso({ tierRiesgo: "CRITICO" })} />,
      );
      expect(
        screen.getByText("Dejó de abonar / saldo en riesgo"),
      ).toBeInTheDocument();
    });
  });
});
