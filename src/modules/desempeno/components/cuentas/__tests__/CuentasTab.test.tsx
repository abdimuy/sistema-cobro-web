import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
    await user.type(screen.getByLabelText("Buscar cliente o folio"), "xicale");
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
    expect(screen.getByText("$150.00 de $150.00")).toBeInTheDocument();
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

  it("al cambiar de pastilla los conteos no parpadean mientras llega la respuesta", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    montar(port);
    await screen.findByText("GERARDO XICALE ANALCO");
    let liberar: () => void = () => {};
    port.cuentasResponse = () =>
      new Promise((res) => {
        liberar = () =>
          res(makeCuentasSemana({ conteos: { ...makeCuentasSemana().conteos, pagados: 141 } }));
      });
    await user.click(screen.getByRole("button", { name: /Pagados/ }));
    expect(within(screen.getByRole("button", { name: /Pagados/ })).getByText("140")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pagados/ })).toHaveAttribute("aria-pressed", "true");
    await act(async () => liberar());
    expect(
      await within(screen.getByRole("button", { name: /Pagados/ })).findByText("141"),
    ).toBeInTheDocument();
  });

  it("usuario sin configurar (409): estado propio, sin Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerCuentas = new DomainError(
      "desempeno_usuario_sin_zona",
      "el usuario no tiene zona",
    );
    montar(port);
    expect(await screen.findByText("Sin configurar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurar en Usuarios" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("una cuenta se abre con el teclado; la que no tiene detalle no es alcanzable", async () => {
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({
      cuentas: [makeCuenta(), makeCuenta({ ventaId: 2, doctoPvId: null, clienteNombre: "SIN DETALLE" })],
    });
    const { onAbrirCuenta } = montar(port);
    const fila = (await screen.findByText("JUANA ANDRADE LECHUGA")).closest("tr")!;
    expect(fila).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(fila, { key: "Enter" });
    fireEvent.keyDown(fila, { key: " " });
    expect(onAbrirCuenta).toHaveBeenCalledTimes(2);
    expect(screen.getByText("SIN DETALLE").closest("tr")).not.toHaveAttribute("tabindex");
  });

  it("saldo, parcialidad y abono de la semana con centavos", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({
      cuentas: [makeCuenta({ saldo: "16650.50", parcialidad: "150.50", abonoSemana: "150.50" })],
    });
    montar(port);
    const fila = (await screen.findByText("JUANA ANDRADE LECHUGA")).closest("tr")!;
    expect(within(fila).getByText("$16,650.50")).toBeInTheDocument();
    expect(within(fila).getByText("$150.50")).toBeInTheDocument();
    await user.hover(within(fila).getByText("Pagó esta semana"));
    expect(await screen.findByText("$150.50 de $150.50")).toBeInTheDocument();
  });
});
