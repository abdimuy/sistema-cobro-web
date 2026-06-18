import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaRecompraCard } from "./FichaRecompraCard";
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
    bandaRecompra: "ALTA",
    scoreRecompra: 82,
    recompraDrivers: ["Compra frecuente en los últimos 6 meses", "Saldo liquidado a tiempo"],
  };
  return { ...base, ...overrides };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FichaRecompraCard", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(<FichaRecompraCard pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaRecompra is empty string", () => {
    const { container } = render(
      <FichaRecompraCard pulso={makePulso({ bandaRecompra: "" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaRecompra is undefined", () => {
    const { container } = render(
      <FichaRecompraCard pulso={makePulso({ bandaRecompra: undefined })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  describe("populated repurchase propensity", () => {
    it("renders the section heading 'Propensión a recompra'", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(screen.getByText("Propensión a recompra")).toBeInTheDocument();
    });

    it("renders the banda badge label for ALTA", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(screen.getByText("Recompra alta")).toBeInTheDocument();
    });

    it("renders the score value", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(screen.getByText("82")).toBeInTheDocument();
    });

    it("renders the '/ 100' score suffix", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(screen.getByText("/ 100")).toBeInTheDocument();
    });

    it("renders driver strings in the 'Por qué' list", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(
        screen.getByText("Compra frecuente en los últimos 6 meses"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Saldo liquidado a tiempo"),
      ).toBeInTheDocument();
    });

    it("renders 'Por qué' label when drivers are present", () => {
      render(<FichaRecompraCard pulso={makePulso()} />);
      expect(screen.getByText("Por qué")).toBeInTheDocument();
    });

    it("does not render 'Por qué' label when drivers are empty", () => {
      render(<FichaRecompraCard pulso={makePulso({ recompraDrivers: [] })} />);
      expect(screen.queryByText("Por qué")).not.toBeInTheDocument();
    });

    it("renders MEDIA banda correctly", () => {
      render(
        <FichaRecompraCard
          pulso={makePulso({ bandaRecompra: "MEDIA", scoreRecompra: 55 })}
        />,
      );
      expect(screen.getByText("Recompra media")).toBeInTheDocument();
      expect(screen.getByText("55")).toBeInTheDocument();
    });

    it("renders BAJA banda correctly", () => {
      render(
        <FichaRecompraCard
          pulso={makePulso({ bandaRecompra: "BAJA", scoreRecompra: 20 })}
        />,
      );
      expect(screen.getByText("Recompra baja")).toBeInTheDocument();
    });

    it("score number uses green for ALTA banda", () => {
      const { container } = render(
        <FichaRecompraCard
          pulso={makePulso({ bandaRecompra: "ALTA", scoreRecompra: 85 })}
        />,
      );
      const scoreEl = container.querySelector("span.font-mono.tabular-nums.font-semibold");
      expect(scoreEl?.className).toMatch(/green/);
      expect(scoreEl?.className).not.toMatch(/amber|gray/);
    });

    it("score number uses amber for MEDIA banda", () => {
      const { container } = render(
        <FichaRecompraCard
          pulso={makePulso({ bandaRecompra: "MEDIA", scoreRecompra: 55 })}
        />,
      );
      const scoreEl = container.querySelector("span.font-mono.tabular-nums.font-semibold");
      expect(scoreEl?.className).toMatch(/amber/);
      expect(scoreEl?.className).not.toMatch(/green|gray/);
    });

    it("score number uses gray for BAJA banda", () => {
      const { container } = render(
        <FichaRecompraCard
          pulso={makePulso({ bandaRecompra: "BAJA", scoreRecompra: 20 })}
        />,
      );
      const scoreEl = container.querySelector("span.font-mono.tabular-nums.font-semibold");
      expect(scoreEl?.className).toMatch(/gray/);
      expect(scoreEl?.className).not.toMatch(/green|amber/);
    });
  });
});
