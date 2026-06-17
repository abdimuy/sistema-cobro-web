import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaCreditoCard } from "./FichaCreditoCard";
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
    bandaCredito: "MEDIO",
    scoreCredito: 58,
    creditoDrivers: ["Atrasos recurrentes en últimos 3 meses", "Saldo alto relativo al límite"],
  };
  return { ...base, ...overrides };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FichaCreditoCard", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(<FichaCreditoCard pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is empty string", () => {
    const { container } = render(
      <FichaCreditoCard pulso={makePulso({ bandaCredito: "" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is undefined", () => {
    const { container } = render(
      <FichaCreditoCard pulso={makePulso({ bandaCredito: undefined })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  describe("populated credit risk", () => {
    it("renders the section heading 'Riesgo de Crédito'", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(screen.getByText("Riesgo de Crédito")).toBeInTheDocument();
    });

    it("renders the banda badge label for MEDIO", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(screen.getByText("Riesgo medio")).toBeInTheDocument();
    });

    it("renders the score value", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(screen.getByText("58")).toBeInTheDocument();
    });

    it("renders the '/ 100' score suffix", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(screen.getByText("/ 100")).toBeInTheDocument();
    });

    it("renders driver strings in the 'Por qué' list", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(
        screen.getByText("Atrasos recurrentes en últimos 3 meses"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Saldo alto relativo al límite"),
      ).toBeInTheDocument();
    });

    it("renders 'Por qué' label when drivers are present", () => {
      render(<FichaCreditoCard pulso={makePulso()} />);
      expect(screen.getByText("Por qué")).toBeInTheDocument();
    });

    it("does not render 'Por qué' label when drivers are empty", () => {
      render(<FichaCreditoCard pulso={makePulso({ creditoDrivers: [] })} />);
      expect(screen.queryByText("Por qué")).not.toBeInTheDocument();
    });

    it("renders BAJO banda correctly", () => {
      render(<FichaCreditoCard pulso={makePulso({ bandaCredito: "BAJO", scoreCredito: 90 })} />);
      expect(screen.getByText("Riesgo bajo")).toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
    });

    it("renders ALTO banda correctly", () => {
      render(<FichaCreditoCard pulso={makePulso({ bandaCredito: "ALTO", scoreCredito: 35 })} />);
      expect(screen.getByText("Riesgo alto")).toBeInTheDocument();
    });

    it("renders CRITICO banda correctly", () => {
      render(<FichaCreditoCard pulso={makePulso({ bandaCredito: "CRITICO", scoreCredito: 10 })} />);
      expect(screen.getByText("Riesgo crítico")).toBeInTheDocument();
    });

    it("score number uses band color, not winback thresholds (ALTO score=75 is orange, not green)", () => {
      // score=75 would be GREEN under winback ScoreBadge (≥70 threshold)
      // but ALTO banda = orange — the credit score must follow the band
      const { container } = render(
        <FichaCreditoCard pulso={makePulso({ bandaCredito: "ALTO", scoreCredito: 75 })} />,
      );
      // The score span should carry orange classes, not green
      const scoreEl = container.querySelector("span.font-mono.tabular-nums.font-semibold");
      expect(scoreEl?.className).toMatch(/orange/);
      expect(scoreEl?.className).not.toMatch(/emerald|green/);
    });

    it("score number uses green for BAJO banda regardless of raw score value", () => {
      const { container } = render(
        <FichaCreditoCard pulso={makePulso({ bandaCredito: "BAJO", scoreCredito: 25 })} />,
      );
      const scoreEl = container.querySelector("span.font-mono.tabular-nums.font-semibold");
      expect(scoreEl?.className).toMatch(/green/);
      expect(scoreEl?.className).not.toMatch(/red/);
    });
  });
});
