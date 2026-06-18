import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaClvCard } from "./FichaClvCard";
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
    clv: "120000.00",
    bandaClv: "ALTO",
  };
  return { ...base, ...overrides };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FichaClvCard", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(<FichaClvCard pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaClv is empty string", () => {
    const { container } = render(
      <FichaClvCard pulso={makePulso({ bandaClv: "" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaClv is undefined", () => {
    const { container } = render(
      <FichaClvCard pulso={makePulso({ bandaClv: undefined })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  describe("populated CLV", () => {
    it("renders the section heading 'Valor del cliente (CLV)'", () => {
      render(<FichaClvCard pulso={makePulso()} />);
      expect(screen.getByText("Valor del cliente (CLV)")).toBeInTheDocument();
    });

    it("renders the banda badge label for ALTO", () => {
      render(<FichaClvCard pulso={makePulso()} />);
      expect(screen.getByText(/CLV alto/)).toBeInTheDocument();
    });

    it("renders the banda badge label for MEDIO", () => {
      render(<FichaClvCard pulso={makePulso({ bandaClv: "MEDIO", clv: "60000.00" })} />);
      expect(screen.getByText(/CLV medio/)).toBeInTheDocument();
    });

    it("renders the banda badge label for BAJO", () => {
      render(<FichaClvCard pulso={makePulso({ bandaClv: "BAJO", clv: "15000.00" })} />);
      expect(screen.getByText(/CLV bajo/)).toBeInTheDocument();
    });

    it("renders the 'Valor estimado' label and formatted monto", () => {
      render(<FichaClvCard pulso={makePulso()} />);
      expect(screen.getByText("Valor estimado")).toBeInTheDocument();
      // formatMoney("120000.00") → "$120,000.00" in es-MX locale (exact text in the monto span)
      expect(screen.getByText("$120,000.00")).toBeInTheDocument();
    });

    it("does not render monto section when clv is undefined", () => {
      render(<FichaClvCard pulso={makePulso({ clv: undefined })} />);
      expect(screen.queryByText("Valor estimado")).not.toBeInTheDocument();
    });

    it("renders the badge with formatted monto included", () => {
      render(<FichaClvCard pulso={makePulso({ clv: "8204.83" })} />);
      // BandaClvBadge renders "CLV alto · $8,205"
      const badge = screen.getByText(/CLV alto/);
      expect(badge.textContent).toMatch(/\$8[,.]?205/);
    });

    it("has an aria-label for the section", () => {
      const { container } = render(<FichaClvCard pulso={makePulso()} />);
      const section = container.querySelector("section[aria-label='Valor del cliente']");
      expect(section).not.toBeNull();
    });
  });
});
