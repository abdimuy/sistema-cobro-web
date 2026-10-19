import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuentasTab } from "../cuentas/CuentasTab";
import { TarjetaCuentas } from "../tablero/TarjetasTablero";
import { MOSTRAR_NO_PAGA, noPagaVisible } from "../lib/noPaga";
import { renderConDesempeno } from "../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeCuentasSemana,
  makeUsuarioTablero,
} from "../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../domain/errors";

// Decisión del dueño 2026-10-19 (opción B): "No paga" se oculta hasta que el API
// reciba la fecha de la promesa (P2 de visitas). Hoy el servidor manda 0.
const conteosSinNoPaga = { porVisitar: 69, noPaga: 0, pagados: 140, sinNada: 46, total: 209 };
const coberturaSinNoPaga = { porVisitar: 69, noPaga: 0, pagados: 140, sinNada: 46 };

function montarCuentas(noPaga: number) {
  const port = new FakeDesempenoPort();
  port.cuentasResponse = makeCuentasSemana({ conteos: { ...conteosSinNoPaga, noPaga } });
  renderConDesempeno(<CuentasTab usuario={makeUsuarioTablero()} onAbrirCuenta={() => {}} />, { port });
  return port;
}

describe("No paga oculto (bandera apagada)", () => {
  it("la bandera está apagada", () => {
    expect(MOSTRAR_NO_PAGA).toBe(false);
  });

  it("Cuentas: sin pastilla No paga; Por visitar, Pagados y Sin nada sí", async () => {
    montarCuentas(0);
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(screen.queryByText(/No paga/)).not.toBeInTheDocument();
    for (const etiqueta of ["Por visitar", "Pagados", "Sin nada"]) {
      expect(screen.getByRole("button", { name: new RegExp(etiqueta) })).toBeInTheDocument();
    }
  });

  it("tablero: el popover de cuentas no lista No paga", () => {
    render(<TarjetaCuentas usuario={makeUsuarioTablero({ coberturaPorColumna: coberturaSinNoPaga })} />);
    expect(screen.getByText("Por visitar")).toBeInTheDocument();
    expect(screen.getByText("Sin nada")).toBeInTheDocument();
    expect(screen.queryByText("No paga")).not.toBeInTheDocument();
  });

  // Si el servidor ya manda no_paga > 0 (P2 desplegado antes de encender la
  // bandera), esas cuentas no se esconden: la pastilla y la barra aparecen con
  // su conteo y sus filas, en vez de sumar un número a "Por visitar" cuya lista
  // no las trae.
  it("Cuentas: con no_paga > 0 la pastilla aparece y filtra por no_paga", async () => {
    const user = userEvent.setup();
    const port = montarCuentas(4);
    const boton = await screen.findByRole("button", { name: /No paga/ });
    expect(boton).toHaveTextContent("4");
    await user.click(boton);
    await waitFor(() =>
      expect(port.cuentasCalls[port.cuentasCalls.length - 1].consulta.columna).toBe("no_paga"),
    );
  });

  it("Cuentas: un error en la pastilla No paga no la esconde", async () => {
    const user = userEvent.setup();
    const port = montarCuentas(4);
    port.throwOnNext.obtenerCuentas = new DomainError("desempeno_x", "falló la carga");
    await user.click(await screen.findByRole("button", { name: /No paga/ }));
    expect(await screen.findByText("falló la carga")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /No paga/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("tablero: con no_paga > 0 la barra aparece", () => {
    render(
      <TarjetaCuentas usuario={makeUsuarioTablero({ coberturaPorColumna: { ...coberturaSinNoPaga, noPaga: 2 } })} />,
    );
    expect(screen.getByText("No paga")).toBeInTheDocument();
  });

  it("noPagaVisible", () => {
    expect(noPagaVisible(false, 0)).toBe(false);
    expect(noPagaVisible(false, null)).toBe(false);
    expect(noPagaVisible(false, 1)).toBe(true);
    expect(noPagaVisible(true, 0)).toBe(true);
    expect(noPagaVisible(true, null)).toBe(true);
  });
});
