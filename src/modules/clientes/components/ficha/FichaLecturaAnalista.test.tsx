import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaLecturaAnalista } from "./FichaLecturaAnalista";
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
    recompraDrivers: ["buen historial de pago"],
    clv: "302.17",
    bandaClv: "MEDIO",
    clvDrivers: ["recompra moderada esperada"],
    creditoResumen: "Buen pagador.",
    recompraResumen: "Recompra moderada.",
    clvResumen: "Valor estimado $302 en 24m.",
  };
  return { ...base, ...overrides };
}

describe("FichaLecturaAnalista", () => {
  it("renders nothing when pulso is undefined", () => {
    const { container } = render(<FichaLecturaAnalista />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when narrativa empty and rasgosIA absent", () => {
    const { container } = render(
      <FichaLecturaAnalista pulso={makePulso({ narrativa: undefined, rasgosIA: undefined })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when both narrativa and rasgosIA empty", () => {
    render(
      <FichaLecturaAnalista pulso={makePulso({ narrativa: undefined, rasgosIA: [] })} />,
    );
    expect(screen.queryByText("Lectura del analista")).not.toBeInTheDocument();
  });

  it("renders the narrativa as a quote with a signed byline (no IA branding)", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Cliente con potencial moderado.",
          rasgosIA: undefined,
        })}
      />,
    );
    expect(screen.getByText("Cliente con potencial moderado.")).toBeInTheDocument();
    expect(screen.getByText("Lectura del analista")).toBeInTheDocument();
    // The card must not carry "IA" branding anywhere.
    expect(screen.queryByText(/\(IA\)/)).not.toBeInTheDocument();
    expect(screen.queryByText("Rasgos")).not.toBeInTheDocument();
  });

  it("renders chips under a 'Rasgos' label but no quote when narrativa absent", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: undefined,
          rasgosIA: ["Reactivación reciente", "Patrón de compra estable"],
        })}
      />,
    );
    // The brief header is always present; the quote paragraph is not.
    expect(screen.getByText("Lectura del analista")).toBeInTheDocument();
    expect(screen.getByText("Rasgos")).toBeInTheDocument();
    expect(screen.getByText("Reactivación reciente")).toBeInTheDocument();
    expect(screen.getByText("Patrón de compra estable")).toBeInTheDocument();
  });

  it("renders both the quote and all rasgo chips when both present", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Cliente con potencial moderado. Últimamente activo.",
          rasgosIA: ["Reactivación reciente", "Patrón de compra estable"],
        })}
      />,
    );
    expect(screen.getByText("Lectura del analista")).toBeInTheDocument();
    expect(screen.getByText("Cliente con potencial moderado. Últimamente activo.")).toBeInTheDocument();
    expect(screen.getByText("Rasgos")).toBeInTheDocument();
    expect(screen.getByText("Reactivación reciente")).toBeInTheDocument();
    expect(screen.getByText("Patrón de compra estable")).toBeInTheDocument();
  });

  it("does not render contexto operativo here (it lives next to the note)", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Texto de prueba.",
          contextoOperativo: "Acuerdo de pago con Carmelo.",
        })}
      />,
    );
    expect(screen.queryByText("Contexto operativo")).not.toBeInTheDocument();
    expect(screen.queryByText("Acuerdo de pago con Carmelo.")).not.toBeInTheDocument();
  });
});
