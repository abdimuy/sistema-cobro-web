import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { CuentasTab } from "../CuentasTab";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeAgenda,
  makeCompromiso,
  makeCuenta,
  makeCuentasSemana,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";
import { DesempenoProvider } from "../../../presentation/context/DesempenoProvider";
import { HttpDesempenoAdapter } from "../../../infrastructure/http/HttpDesempenoAdapter";
import { server } from "../../../../../test/msw/server";
import { desempenoHandlers } from "../../../../../test/msw/handlers/desempeno";

// Estas pruebas fijan el comportamiento con "No paga" encendido (P2 de
// visitas); el apagado lo cubre components/__tests__/noPagaOculto.test.tsx.
vi.mock("../../lib/noPaga", async (original) => ({
  ...(await original<typeof import("../../lib/noPaga")>()),
  MOSTRAR_NO_PAGA: true,
}));

function montar(port = new FakeDesempenoPort(), onAbrirCuenta = vi.fn()) {
  renderConDesempeno(<CuentasTab usuario={makeUsuarioTablero()} onAbrirCuenta={onAbrirCuenta} />, {
    port,
  });
  return { port, onAbrirCuenta };
}
const ultima = (port: FakeDesempenoPort) => port.cuentasCalls[port.cuentasCalls.length - 1].consulta;

describe("CuentasTab", () => {
  it("abre en Por visitar (D18), ordenado por más atrasos", async () => {
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(ultima(port)).toEqual({ columna: "por_visitar", q: "", orden: "atrasos", dir: "desc" });
    expect(port.cuentasCalls[0].uid).toBe("uid-juan");
  });

  it("pastillas con los conteos del API y 'Sin nada' aparte", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(within(screen.getByRole("button", { name: /Pagados/ })).getByText("140")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /Sin nada/ })).getByText("46")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pagados/ }));
    await waitFor(() => expect(ultima(port).columna).toBe("pagados"));
    await user.click(screen.getByRole("button", { name: /Sin nada/ }));
    await waitFor(() => expect(ultima(port).columna).toBe("sin_nada"));
  });

  // D18 / E-INF-018: tres columnas del servidor y "Sin nada" como filtro aparte.
  it("pinta Por visitar, No paga, Pagados y el filtro Sin nada aparte", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("GERARDO XICALE ANALCO");
    for (const etiqueta of ["Por visitar", "No paga", "Pagados", "Sin nada"]) {
      expect(screen.getByRole("button", { name: new RegExp(etiqueta) })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /Volver|Después|Sin visitar/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /Por visitar/ })).getByText("66")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /No paga/ })).getByText("3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /No paga/ }));
    await waitFor(() => expect(ultima(port).columna).toBe("no_paga"));
    await user.click(screen.getByRole("button", { name: /Sin nada/ }));
    await waitFor(() => expect(ultima(port).columna).toBe("sin_nada"));
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

  it("atrasos negativos (cuenta adelantada) se pintan 'Al corriente' en verde, como el teléfono", async () => {
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({ cuentas: [makeCuenta({ numAtrasos: -6 })] });
    montar(port);
    const celda = await screen.findByText("Al corriente");
    expect(celda).toHaveClass("text-dsm-ok");
    expect(screen.queryByText(/-6/)).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: /No paga/ }));
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

  // DA-2: Cuentas de un usuario con semana vencida responde 409; reintentar no lo arregla.
  it("semana vencida (409): aviso propio con el mensaje del servidor, sin Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerCuentas = new DomainError(
      "desempeno_semana_vencida",
      "el inicio de semana del usuario tiene más de 14 días",
    );
    montar(port);
    expect(await screen.findByText("Semana vencida")).toBeInTheDocument();
    expect(screen.getByText("el inicio de semana del usuario tiene más de 14 días")).toBeInTheDocument();
    expect(screen.queryByText("No se pudieron cargar las cuentas")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("zona excluida (409): aviso propio, sin Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerCuentas = new DomainError(
      "desempeno_zona_excluida",
      "la zona del usuario está excluida de desempeño",
    );
    montar(port);
    expect(await screen.findByText("Zona excluida")).toBeInTheDocument();
    expect(screen.getByText("la zona del usuario está excluida de desempeño")).toBeInTheDocument();
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

// Visitas P2, Tarea 21: columna "Compromiso" con lo que deriva el servidor
// (GET /v2/visitas/agenda). El escritorio no calcula el estado: solo lo rotula.
describe("CuentasTab — columna Compromiso", () => {
  const filaDe = async (nombre: string) => (await screen.findByText(nombre)).closest("tr")!;
  const celdaDe = (fila: HTMLElement) => within(fila).getByTestId("celda-compromiso");

  it("pide la agenda de la zona del usuario y pinta la promesa sólo en su venta", async () => {
    const port = new FakeDesempenoPort();
    port.agendaResponse = makeAgenda(makeCompromiso({ ventaId: 13791100 }));
    montar(port);
    const gerardo = await filaDe("GERARDO XICALE ANALCO");
    expect(screen.getByRole("columnheader", { name: "Compromiso" })).toBeInTheDocument();
    await waitFor(() => expect(celdaDe(gerardo)).toHaveTextContent("Promesa 20 oct · $150"));
    expect(celdaDe(await filaDe("JUANA ANDRADE LECHUGA"))).toHaveTextContent(/^$/);
    expect(port.agendaCalls).toEqual([{ zonaId: 21563, hoy: null }]);
  });

  it("cita con hora, cita sin hora e incumplida, tal como las manda el servidor", async () => {
    const port = new FakeDesempenoPort();
    port.cuentasResponse = makeCuentasSemana({
      cuentas: [
        makeCuenta({ ventaId: 1, clienteNombre: "ROSA MARÍA TECUANHUEY" }),
        makeCuenta({ ventaId: 2, clienteNombre: "JOSÉ LUIS COYOTL" }),
        makeCuenta({ ventaId: 3, clienteNombre: "PATRICIA ZEMPOALTECATL" }),
      ],
    });
    port.agendaResponse = makeAgenda(
      makeCompromiso({ ventaId: 1, tipo: "cita", dia: "2026-10-18", hora: "16:30", montoCentavos: null }),
      makeCompromiso({ ventaId: 2, tipo: "cita", dia: "2026-10-18", hora: null, montoCentavos: null }),
      // Día futuro con estado incumplida: se pinta lo que dijo el servidor.
      makeCompromiso({ ventaId: 3, estado: "incumplida", dia: "2026-10-12" }),
    );
    montar(port);
    await waitFor(async () =>
      expect(celdaDe(await filaDe("ROSA MARÍA TECUANHUEY"))).toHaveTextContent("Cita 18 oct 16:30"),
    );
    expect(celdaDe(await filaDe("JOSÉ LUIS COYOTL"))).toHaveTextContent(/^Cita 18 oct$/);
    expect(celdaDe(await filaDe("PATRICIA ZEMPOALTECATL"))).toHaveTextContent("Incumplida 12 oct");
  });

  it("cerrada_sin_cumplir no se pinta", async () => {
    const port = new FakeDesempenoPort();
    port.agendaResponse = makeAgenda(makeCompromiso({ ventaId: 13791100, estado: "cerrada_sin_cumplir" }));
    montar(port);
    const gerardo = await filaDe("GERARDO XICALE ANALCO");
    await waitFor(() => expect(port.agendaCalls).toHaveLength(1));
    await waitFor(() => expect(celdaDe(gerardo)).not.toHaveTextContent("·"));
    expect(celdaDe(gerardo)).toHaveTextContent(/^$/);
    expect(within(gerardo).queryByText(/Promesa|Incumplida|Cumplida/)).not.toBeInTheDocument();
  });

  it("si la agenda falla las cuentas se pintan igual y la celda no finge que no hay compromiso", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerAgenda = new DomainError("http_403", "permiso denegado");
    montar(port);
    const gerardo = await filaDe("GERARDO XICALE ANALCO");
    await waitFor(() => expect(celdaDe(gerardo)).toHaveAttribute("title", "Sin dato"));
    expect(celdaDe(gerardo)).toHaveTextContent("·");
    expect(screen.queryByText("No se pudieron cargar las cuentas")).not.toBeInTheDocument();
  });

  it("usuario sin zona: no pide la agenda", async () => {
    const port = new FakeDesempenoPort();
    renderConDesempeno(
      <CuentasTab usuario={makeUsuarioTablero({ zonaId: null })} onAbrirCuenta={vi.fn()} />,
      { port },
    );
    await screen.findByText("GERARDO XICALE ANALCO");
    expect(port.agendaCalls).toHaveLength(0);
  });

  it("el popover del chip repite el compromiso", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.agendaResponse = makeAgenda(makeCompromiso({ ventaId: 13785217 }));
    montar(port);
    const juana = await filaDe("JUANA ANDRADE LECHUGA");
    await waitFor(() => expect(celdaDe(juana)).toHaveTextContent("Promesa 20 oct · $150"));
    await user.hover(within(juana).getByText("Pagó esta semana"));
    await waitFor(() => expect(screen.getAllByText("Promesa 20 oct · $150")).toHaveLength(2));
    // Encabezado de la tabla + renglón del popover.
    expect(screen.getAllByText("Compromiso")).toHaveLength(2);
  });

  // Con MSW y el adaptador HTTP real: la agenda de la zona 21563 trae una
  // promesa para MARÍA ELENA y una cita cerrada sin cumplir para JUANA.
  it("con MSW: pinta la promesa de la agenda y nada en la cita cerrada", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => { if (u.pathname.endsWith("/visitas/agenda")) url = u; } }));
    render(
      <MemoryRouter>
        <DesempenoProvider port={new HttpDesempenoAdapter(axios.create({ baseURL: "http://api.test/v2" }))}>
          <CuentasTab usuario={makeUsuarioTablero()} onAbrirCuenta={vi.fn()} />
        </DesempenoProvider>
      </MemoryRouter>,
    );
    const maria = await filaDe("MARÍA ELENA CUAUTLE TLAPA");
    await waitFor(() => expect(celdaDe(maria)).toHaveTextContent("Promesa 20 oct · $150"));
    expect(celdaDe(await filaDe("JUANA ANDRADE LECHUGA"))).toHaveTextContent(/^$/);
    expect(url?.searchParams.get("zona_id")).toBe("21563");
  });
});
