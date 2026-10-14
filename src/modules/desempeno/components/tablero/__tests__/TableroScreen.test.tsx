import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableroScreen } from "../TableroScreen";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeLinea,
  makeTablero,
  makeUsuarioSinConfigurar,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";

function montar(port = new FakeDesempenoPort(), onAbrirUsuario = vi.fn(), puedeConfigurar = true) {
  renderConDesempeno(<TableroScreen onAbrirUsuario={onAbrirUsuario} puedeConfigurar={puedeConfigurar} />, {
    port,
  });
  return { port, onAbrirUsuario };
}

function ultimaConsulta(port: FakeDesempenoPort) {
  return port.tableroCalls[port.tableroCalls.length - 1]?.consulta;
}

describe("TableroScreen", () => {
  beforeEach(() => localStorage.clear());

  it("una fila por usuario configurado y la fila 'Sin configurar' con enlace a Usuarios", async () => {
    montar();
    expect(await screen.findByText("Juan Carlos Méndez")).toBeInTheDocument();
    expect(screen.getByText("Rosa Isela Pacheco")).toBeInTheDocument();
    const norma = screen.getByText("Norma Velázquez Rojas").closest("tr")!;
    expect(within(norma).getByText("Sin configurar")).toBeInTheDocument();
    expect(within(norma).getByText(/No tiene zona asignada/)).toBeInTheDocument();
    expect(within(norma).getByRole("link", { name: "Configurar" })).toHaveAttribute("href", "/settings");
  });

  it("sin inicio de semana lo dice; sin permiso no hay enlace", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      usuarios: [makeUsuarioSinConfigurar({ motivoNoConfigurado: "sin_inicio_semana" })],
    });
    montar(port, vi.fn(), false);
    const norma = (await screen.findByText("Norma Velázquez Rojas")).closest("tr")!;
    expect(within(norma).getByText(/No tiene inicio de semana/)).toBeInTheDocument();
    expect(within(norma).queryByRole("link")).not.toBeInTheDocument();
    expect(within(norma).getByText("Pide a un administrador")).toBeInTheDocument();
  });

  it("muestra cifras por usuario y NINGÚN total del equipo (D14)", async () => {
    montar();
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    expect(within(fila).getByText("$8,600")).toBeInTheDocument();
    expect(within(fila).getByText("Faltan")).toBeInTheDocument();
    expect(within(fila).getByText("46")).toBeInTheDocument();
    expect(within(fila).getByText("65.9%")).toBeInTheDocument();
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    expect(document.querySelector("tfoot")).toBeNull();
  });

  it("la hora del encabezado es la del servidor en la zona de la oficina", async () => {
    montar();
    expect(await screen.findByText("Actualizado 16:40")).toBeInTheDocument();
    expect(screen.getByText("miércoles 14 de octubre · 16:40")).toBeInTheDocument();
  });

  it("Semana, umbral y horario viajan en la consulta (D7)", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("Juan Carlos Méndez");

    await user.click(screen.getByRole("button", { name: "Semana" }));
    await waitFor(() => expect(ultimaConsulta(port)?.periodo).toBe("semana"));

    await user.selectOptions(screen.getByLabelText("Pausa desde"), "30");
    await waitFor(() => expect(ultimaConsulta(port)?.pausaMin).toBe(30));

    await user.click(screen.getByRole("button", { name: "Horario" }));
    await waitFor(() => expect(ultimaConsulta(port)?.horario).toEqual({ desde: "08:00", hasta: "18:00" }));
    await user.selectOptions(screen.getByLabelText("Fin de horario"), "19:00");
    await waitFor(() => expect(ultimaConsulta(port)?.horario).toEqual({ desde: "08:00", hasta: "19:00" }));
  });

  it("en Semana la línea se pinta por día con su etiqueta", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      periodo: "semana",
      usuarios: [
        makeUsuarioTablero({ lineas: [makeLinea({ dia: "2026-10-13" }), makeLinea({ dia: "2026-10-14" })] }),
      ],
    });
    montar(port);
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    expect(within(fila).getAllByTestId("linea-actividad")).toHaveLength(2);
    expect(within(fila).getByText("mar 13 oct")).toBeInTheDocument();
  });

  it("popover de pagos: solo efectivo, transferencia y cheque; condonación aparte; sin Depósito", async () => {
    const user = userEvent.setup();
    montar();
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    await user.hover(within(fila).getByText("$8,600"));
    expect(await screen.findByText("Pagos de hoy")).toBeInTheDocument();
    expect(screen.getByText("Transferencia")).toBeInTheDocument();
    expect(screen.getByText("3 · $800")).toBeInTheDocument();
    expect(screen.getByText("Condonaciones (aparte)")).toBeInTheDocument();
    expect(screen.queryByText(/Depósito/)).not.toBeInTheDocument();
  });

  it("popover del nombre con teclado, sin modelo de teléfono", async () => {
    montar();
    const nombre = await screen.findByText("Juan Carlos Méndez");
    nombre.focus();
    expect(await screen.findByText("Ventas en su universo")).toBeInTheDocument();
    expect(screen.getByText("232")).toBeInTheDocument();
    expect(screen.queryByText(/Teléfono/)).not.toBeInTheDocument();
  });

  it("popover del estado: último movimiento y aviso de pausa cuando no hay actividad", async () => {
    const user = userEvent.setup();
    montar();
    const fila = (await screen.findByText("Rosa Isela Pacheco")).closest("tr")!;
    await user.hover(within(fila).getByText("Desde 15:05"));
    expect(await screen.findByText("Sin actividad desde 15:05")).toBeInTheDocument();
    expect(screen.getByText("Cuenta como pausa: pasaron 45 min o más sin movimientos.")).toBeInTheDocument();
  });

  it("popover de cuentas con los segmentos del API", async () => {
    const user = userEvent.setup();
    montar();
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    await user.hover(within(fila).getByText("Faltan"));
    expect(await screen.findByText("Cuentas de la semana")).toBeInTheDocument();
    expect(screen.getByText("Sin visitar")).toBeInTheDocument();
    expect(screen.getByText("140")).toBeInTheDocument();
  });

  it("popover de % cobro con lo que falta tal como llega del API (contrato v2)", async () => {
    const user = userEvent.setup();
    montar();
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    await user.hover(within(fila).getByText("65.9%"));
    expect(await screen.findByText("Cobro de la semana · 65.9%")).toBeInTheDocument();
    expect(screen.getByText("Falta por cobrar")).toBeInTheDocument();
    expect(screen.getByText("$4,450")).toBeInTheDocument();
    expect(screen.getByText("$13,050")).toBeInTheDocument();
  });

  it("ordenar por Pagos y buscar sin acentos", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Juan Carlos Méndez");
    // Primer clic: mayor a menor ($8,600 antes que $5,100); segundo: al revés.
    await user.click(screen.getByRole("button", { name: /Pagos/ }));
    expect(screen.getAllByRole("row", { name: /Abrir ficha de/ })[0]).toHaveAccessibleName(
      "Abrir ficha de Juan Carlos Méndez",
    );
    await user.click(screen.getByRole("button", { name: /Pagos/ }));
    expect(screen.getAllByRole("row", { name: /Abrir ficha de/ })[0]).toHaveAccessibleName(
      "Abrir ficha de Rosa Isela Pacheco",
    );

    await user.type(screen.getByPlaceholderText("Buscar cobrador o zona"), "pacheco");
    expect(screen.queryByText("Juan Carlos Méndez")).not.toBeInTheDocument();
    expect(screen.getByText("Rosa Isela Pacheco")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Buscar cobrador o zona"));
    await user.type(screen.getByPlaceholderText("Buscar cobrador o zona"), "zzz");
    expect(screen.getByText("Nadie coincide con “zzz”")).toBeInTheDocument();
  });

  it("clic o Enter en la fila abre la ficha", async () => {
    const user = userEvent.setup();
    const { onAbrirUsuario } = montar();
    const fila = (await screen.findByText("Rosa Isela Pacheco")).closest("tr")!;
    await user.click(within(fila).getByText("$5,100"));
    expect(onAbrirUsuario).toHaveBeenCalledWith("uid-rosa");
    fila.focus();
    await user.keyboard("{Enter}");
    expect(onAbrirUsuario).toHaveBeenCalledTimes(2);
  });

  it("clic dentro de un popover no abre la ficha", async () => {
    const user = userEvent.setup();
    const { onAbrirUsuario } = montar();
    const fila = (await screen.findByText("Juan Carlos Méndez")).closest("tr")!;
    await user.hover(within(fila).getByText("$8,600"));
    await user.click(await screen.findByText("Pagos de hoy"));
    expect(onAbrirUsuario).not.toHaveBeenCalled();
  });

  it("error al cargar: mensaje y Reintentar", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerTablero = new DomainError(
      "desempeno_firestore_unavailable",
      "no se pudo consultar a los usuarios",
    );
    montar(port);
    expect(await screen.findByText("No se pudo cargar el tablero")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Juan Carlos Méndez")).toBeInTheDocument();
  });

  it("falla la actualización: se quedan las filas y aparece el aviso", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    montar(port);
    await screen.findByText("Juan Carlos Méndez");
    port.throwOnNext.obtenerTablero = new DomainError("network_error", "error de red");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(await screen.findByText("No se pudo actualizar. Se muestran los datos de las 16:40.")).toBeInTheDocument();
    expect(screen.getByText("Juan Carlos Méndez")).toBeInTheDocument();
  });

  it("sin usuarios: estado vacío", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({ usuarios: [] });
    montar(port);
    expect(await screen.findByText("No hay usuarios para mostrar")).toBeInTheDocument();
  });

  it("la vista elegida cambia la línea de todas las filas", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Juan Carlos Méndez");
    expect(screen.getAllByTestId("linea-actividad")[0]).toHaveAttribute("data-vista", "bloques");
    await user.click(screen.getByRole("button", { name: "Puntos" }));
    expect(screen.getAllByTestId("linea-actividad")[0]).toHaveAttribute("data-vista", "puntos");
  });
});
