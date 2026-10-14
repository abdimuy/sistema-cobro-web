import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuentasTab } from "../CuentasTab";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeCuenta,
  makeCuentasSemana,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";

function montar(port = new FakeDesempenoPort(), onAbrirCuenta = vi.fn()) {
  renderConDesempeno(<CuentasTab usuario={makeUsuarioTablero()} onAbrirCuenta={onAbrirCuenta} />, {
    port,
  });
  return { port, onAbrirCuenta };
}
const ultima = (port: FakeDesempenoPort) => port.cuentasCalls[port.cuentasCalls.length - 1].consulta;

describe("CuentasTab", () => {
  it("abre en Sin visitar, ordenado por más atrasos", async () => {
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(ultima(port)).toEqual({ segmento: "sin_visitar", q: "", orden: "atrasos", dir: "desc" });
    expect(port.cuentasCalls[0].uid).toBe("uid-juan");
  });

  it("pastillas con los conteos del API y 'Sin nada' aparte", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(within(screen.getByRole("button", { name: /Pagados/ })).getByText("140")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /Sin nada/ })).getByText("46")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pagados/ }));
    await waitFor(() => expect(ultima(port).segmento).toBe("pagados"));
    await user.click(screen.getByRole("button", { name: /Sin nada/ }));
    await waitFor(() => expect(ultima(port).segmento).toBe("sin_nada"));
  });

  it("orden y búsqueda viajan al API", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    await user.selectOptions(screen.getByLabelText("Ordenar"), "saldo");
    await waitFor(() => expect(ultima(port)).toMatchObject({ orden: "saldo", dir: "desc" }));
    await user.type(screen.getByPlaceholderText("Cliente o folio"), "xicale");
    await waitFor(() => expect(ultima(port).q).toBe("xicale"));
    expect(port.cuentasCalls.filter((c) => c.consulta.q === "xic")).toHaveLength(0);
  });

  it("chip del estado como en el teléfono, con popover del servidor", async () => {
    const user = userEvent.setup();
    montar();
    const chip = await screen.findByText("Pagó esta semana");
    expect(chip.closest("[data-trato]")).toHaveAttribute("data-trato", "pagado");
    await user.hover(chip);
    expect(await screen.findByText("No hace falta volver")).toBeInTheDocument();
    expect(screen.getByText("Pago · mié 14 oct 08:20")).toBeInTheDocument();
    expect(screen.getByText("$150 de $150")).toBeInTheDocument();
  });

  it("atrasos y clic en la cuenta", async () => {
    const user = userEvent.setup();
    const { onAbrirCuenta } = montar();
    expect(await screen.findByText("Al corriente")).toBeInTheDocument();
    expect(screen.getByText("6 atrasos")).toBeInTheDocument();
    await user.click(screen.getByText("GERARDO XICALE ANALCO"));
    expect(onAbrirCuenta).toHaveBeenCalledWith(expect.objectContaining({ ventaId: 13791100 }));
  });

  it("una cuenta sin docto_pv_id no se puede abrir", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({ cuentas: [makeCuenta({ doctoPvId: null })] });
    const { onAbrirCuenta } = montar(port);
    const fila = (await screen.findByText("JUANA ANDRADE LECHUGA")).closest("tr")!;
    expect(fila).toHaveAttribute("aria-disabled", "true");
    await user.click(fila);
    expect(onAbrirCuenta).not.toHaveBeenCalled();
  });

  it("grupo vacío y error", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({ cuentas: [] });
    montar(port);
    expect(await screen.findByText("No hay cuentas en este grupo")).toBeInTheDocument();

    port.throwOnNext.obtenerCuentas = new DomainError(
      "desempeno_usuario_sin_inicio_semana",
      "el usuario no tiene inicio de semana",
    );
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByText("el usuario no tiene inicio de semana")).toBeInTheDocument();
  });
});
