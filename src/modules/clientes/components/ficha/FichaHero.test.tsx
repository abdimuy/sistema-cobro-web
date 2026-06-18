import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FichaHero } from "./FichaHero";
import type { FichaCliente } from "../../domain/entities/FichaCliente";

function makeFicha(overrides: Partial<FichaCliente> = {}): FichaCliente {
  return {
    clienteId: 664039,
    nombre: "DORALY OROPEZA ROSETE",
    direccion: {
      calle: "C ADOLFO LOPEZ MATEOS",
      colonia: "COL CENTRO",
      poblacion: "SAN JOSE TILAPA",
      estado: "PUEBLA",
    },
    telefono: "5550001111",
    limiteCredito: "10000",
    notas: "CASA DE COLOR FUCSIA.",
    zona: "R/12",
    cobrador: "RUBEN FLORES",
    estatus: "B",
    resumen: {
      totalComprado: "55200",
      totalAbonado: "55200",
      saldo: "0",
      pctLiquidado: "100",
      numVentas: 10,
      numPagos: 168,
      ticketPromedio: "5520",
      abonosPorMes: [],
      compradoVsAbonado: [],
    },
    pulso: {
      score: 85,
      segmento: "DORMIDO_VALIOSO",
      estadoPago: "LIQUIDADO",
      recenciaDias: 60,
      frecuencia: 10,
      monetary: "55200",
      saldo: "0",
      porLiquidarPct: "100",
      fechaUltimaCompra: null,
      fechaUltimoPago: null,
      nextBestProduct: "",
      numPagos: 168,
      cadenciaDias: 9,
      diasAtrasoProm: 1,
      pctPagosATiempo: "93.8",
      fechaProxPago: null,
      montoProxPago: "0",
      tierRiesgo: "AL_DIA",
    },
    ubicacion: { lat: 0, lng: 0, disponible: false },
    ...overrides,
  };
}

describe("FichaHero", () => {
  it("labels the score as Reactivación (not the legacy 'Score')", () => {
    render(<FichaHero ficha={makeFicha()} />);
    expect(screen.getByText("Reactivación")).toBeInTheDocument();
    expect(screen.queryByText("Score")).not.toBeInTheDocument();
  });

  it("does not show the cryptic estatus code in the metadata line", () => {
    render(<FichaHero ficha={makeFicha({ estatus: "B" })} />);
    // The meta line shows zona/cobrador/folio but never the bare estatus "· B".
    expect(screen.queryByText(/· B$/)).not.toBeInTheDocument();
  });

  it("renders the note in a labelled Nota block", () => {
    render(<FichaHero ficha={makeFicha({ notas: "CASA DE COLOR FUCSIA." })} />);
    expect(screen.getByText("Nota")).toBeInTheDocument();
    expect(screen.getByText(/CASA DE COLOR FUCSIA/)).toBeInTheDocument();
  });

  it("collapses a long note behind a 'ver más' toggle", () => {
    const longNote = "A".repeat(200) + " FIN";
    render(<FichaHero ficha={makeFicha({ notas: longNote })} />);
    const toggle = screen.getByRole("button", { name: "ver más" });
    expect(toggle).toBeInTheDocument();
    expect(screen.queryByText(/FIN/)).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "ver menos" })).toBeInTheDocument();
    expect(screen.getByText(/FIN/)).toBeInTheDocument();
  });

  it("does not show a 'ver más' toggle for a short note", () => {
    render(<FichaHero ficha={makeFicha({ notas: "Nota corta." })} />);
    expect(screen.queryByRole("button", { name: "ver más" })).not.toBeInTheDocument();
  });
});
