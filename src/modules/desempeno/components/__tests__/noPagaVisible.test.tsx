import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CuentasTab } from "../cuentas/CuentasTab";
import { TarjetaCuentas } from "../tablero/TarjetasTablero";
import { renderConDesempeno } from "../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeCuentasSemana,
  makeUsuarioTablero,
} from "../../application/__tests__/fakeDesempenoPort";

vi.mock("../lib/noPaga", async (original) => ({
  ...(await original<typeof import("../lib/noPaga")>()),
  MOSTRAR_NO_PAGA: true,
}));

// Con la bandera encendida (P2 de visitas), "No paga" vuelve aunque llegue en 0.
describe("No paga visible (bandera encendida)", () => {
  it("Cuentas: pastilla No paga con 0", async () => {
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({
      conteos: { porVisitar: 69, noPaga: 0, pagados: 140, sinNada: 46, total: 209 },
    });
    renderConDesempeno(<CuentasTab usuario={makeUsuarioTablero()} onAbrirCuenta={() => {}} />, { port });
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(screen.getByRole("button", { name: /No paga/ })).toHaveTextContent("0");
  });

  it("tablero: barra No paga con 0", () => {
    render(
      <TarjetaCuentas
        usuario={makeUsuarioTablero({ coberturaPorColumna: { porVisitar: 69, noPaga: 0, pagados: 140, sinNada: 46 } })}
      />,
    );
    expect(screen.getByText("No paga")).toBeInTheDocument();
  });
});
