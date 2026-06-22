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
    expect(screen.queryByText("Lectura del analista (IA)")).not.toBeInTheDocument();
  });

  it("renders panel title and narrativa when narrativa non-empty, no rasgos", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Cliente con potencial moderado.",
          rasgosIA: undefined,
        })}
      />,
    );
    expect(screen.getByText("Lectura del analista (IA)")).toBeInTheDocument();
    expect(screen.getByText("Cliente con potencial moderado.")).toBeInTheDocument();
    expect(screen.queryByText("Rasgos (IA)")).not.toBeInTheDocument();
  });

  it("renders chips but no narrativa paragraph when narrativa absent, rasgos present", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: undefined,
          rasgosIA: ["Reactivación reciente", "Patrón de compra estable"],
        })}
      />,
    );
    expect(screen.getByText("Lectura del analista (IA)")).toBeInTheDocument();
    expect(screen.getByText("Rasgos (IA)")).toBeInTheDocument();
    expect(screen.getByText("Reactivación reciente")).toBeInTheDocument();
    expect(screen.getByText("Patrón de compra estable")).toBeInTheDocument();
  });

  it("renders both narrativa and all rasgo chips when both present", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Cliente con potencial moderado. Últimamente activo.",
          rasgosIA: ["Reactivación reciente", "Patrón de compra estable"],
        })}
      />,
    );
    expect(screen.getByText("Lectura del analista (IA)")).toBeInTheDocument();
    expect(screen.getByText("Cliente con potencial moderado. Últimamente activo.")).toBeInTheDocument();
    expect(screen.getByText("Rasgos (IA)")).toBeInTheDocument();
    expect(screen.getByText("Reactivación reciente")).toBeInTheDocument();
    expect(screen.getByText("Patrón de compra estable")).toBeInTheDocument();
  });

  it("renders the contexto operativo line when contextoOperativo is non-empty", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: "Cliente con potencial moderado.",
          contextoOperativo: "Acuerdo de pago con Carmelo; domicilio compartido con Amada.",
        })}
      />,
    );
    expect(screen.getByText("Contexto operativo")).toBeInTheDocument();
    expect(
      screen.getByText("Acuerdo de pago con Carmelo; domicilio compartido con Amada."),
    ).toBeInTheDocument();
  });

  it("renders the panel with only the contexto line when narrativa and rasgos absent", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({
          narrativa: undefined,
          rasgosIA: undefined,
          contextoOperativo: "Responsable de pago: la hija.",
        })}
      />,
    );
    expect(screen.getByText("Lectura del analista (IA)")).toBeInTheDocument();
    expect(screen.getByText("Contexto operativo")).toBeInTheDocument();
    expect(screen.getByText("Responsable de pago: la hija.")).toBeInTheDocument();
  });

  it("does not render the contexto line when contextoOperativo is empty", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({ narrativa: "Texto de prueba.", contextoOperativo: undefined })}
      />,
    );
    expect(screen.queryByText("Contexto operativo")).not.toBeInTheDocument();
  });

  it("shows the InfoHint tooltip trigger when panel is rendered", () => {
    render(
      <FichaLecturaAnalista
        pulso={makePulso({ narrativa: "Texto de prueba." })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Lectura del analista \(IA\)/i }),
    ).toBeInTheDocument();
  });
});
