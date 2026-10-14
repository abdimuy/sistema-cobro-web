import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActividadTab } from "../ActividadTab";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeActividadPago,
  makeActividadVisita,
  makeCatalogos,
  makePaginaActividad,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";
import { CLAVE_COLUMNAS } from "../../../presentation/actividadPreferencias";

const OPCIONES_REGISTRO = [
  { valor: "uid-juan", etiqueta: "Juan Carlos Méndez" },
  { valor: "uid-lupita", etiqueta: "Guadalupe Romero Nava" },
];

function montar(
  port = new FakeDesempenoPort(),
  onAbrirActividad = vi.fn(),
  onAbrirVenta?: (v: { clienteId: number; doctoPvId: number }) => void,
) {
  renderConDesempeno(
    <ActividadTab
      usuario={makeUsuarioTablero()}
      opcionesRegistro={OPCIONES_REGISTRO}
      onAbrirActividad={onAbrirActividad}
      onAbrirVenta={onAbrirVenta}
    />,
    { port },
  );
  return { port, onAbrirActividad };
}

const ultimaConsulta = (port: FakeDesempenoPort) =>
  port.actividadCalls[port.actividadCalls.length - 1].filtros;

describe("ActividadTab", () => {
  beforeEach(() => localStorage.clear());

  it("toda la zona: renglones y totales del filtro tal como llegan", async () => {
    const { port } = montar();
    expect(await screen.findByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    expect(port.actividadCalls[0].uid).toBe("uid-juan");
    expect(screen.getByText("5 movimientos")).toBeInTheDocument();
    // totales.importe es solo dinero (contrato v2 §4): la condonación no suma.
    expect(screen.getByText("cobrado $450")).toBeInTheDocument();
    expect(screen.getByText("3 pagos")).toBeInTheDocument();
  });

  it("filtros de tipo, forma, visita y quién registró viajan al API; formas y visitas salen del catálogo", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Visita" })).toBeEnabled());
    expect(port.catalogosCalls).toBe(1);

    await user.selectOptions(screen.getByLabelText("Tipo"), "pago");
    await waitFor(() => expect(ultimaConsulta(port).tipos).toEqual(["pago"]));

    const forma = screen.getByLabelText("Forma");
    expect(within(forma).queryByRole("option", { name: "Depósito" })).not.toBeInTheDocument();
    expect(within(forma).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Todas",
      "Efectivo",
      "Transferencia",
      "Cheque",
      "Condonación",
      "Otra",
    ]);
    await user.selectOptions(forma, "transferencia");
    await waitFor(() => expect(ultimaConsulta(port).formasCobro).toEqual(["transferencia"]));

    const visita = screen.getByRole("combobox", { name: "Visita" });
    expect(within(visita).getAllByRole("option")).toHaveLength(6);
    expect(within(visita).getByRole("group", { name: "No estaba" })).toBeInTheDocument();
    await user.selectOptions(visita, "Casa cerrada con candado");
    await waitFor(() =>
      expect(ultimaConsulta(port).tiposVisita).toEqual(["Casa cerrada con candado"]),
    );

    await user.selectOptions(screen.getByLabelText("Registró"), "oficina");
    await waitFor(() => expect(ultimaConsulta(port).registradoPor).toEqual(["oficina"]));
  });

  it("sin catálogos no se inventan opciones y la tabla sigue", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerCatalogos = new DomainError("desempeno_firestore_unavailable", "x");
    montar(port);
    expect(await screen.findByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Visita" })).toBeDisabled());
    expect(within(screen.getByLabelText("Forma")).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByLabelText("Forma")).toBeDisabled();
  });

  it("la búsqueda espera a que termines de escribir", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.type(screen.getByLabelText("Buscar cliente o folio"), "andrade");
    await waitFor(() => expect(ultimaConsulta(port).q).toBe("andrade"));
    expect(port.actividadCalls.filter((c) => c.filtros.q === "andr")).toHaveLength(0);
  });

  it("fechas en días de la oficina; un rango invertido avisa y no se manda", async () => {
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");

    fireEvent.change(screen.getByLabelText("Del"), { target: { value: "2026-10-13" } });
    await waitFor(() => expect(ultimaConsulta(port).desde).toBe("2026-10-13T06:00:00Z"));

    fireEvent.change(screen.getByLabelText("al"), { target: { value: "2026-10-12" } });
    expect(screen.getByText("El rango está invertido")).toBeInTheDocument();
    expect(ultimaConsulta(port).hasta).toBeNull();
    expect(ultimaConsulta(port).desde).toBe("2026-10-13T06:00:00Z");

    fireEvent.change(screen.getByLabelText("al"), { target: { value: "2026-10-14" } });
    await waitFor(() => expect(ultimaConsulta(port).hasta).toBe("2026-10-15T06:00:00Z"));
    expect(screen.queryByText("El rango está invertido")).not.toBeInTheDocument();
  });

  it("vistas predefinidas", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: "Solo Juan Carlos" }));
    await waitFor(() => expect(ultimaConsulta(port).registradoPor).toEqual(["uid-juan"]));
    await user.click(screen.getByRole("button", { name: "Transferencias" }));
    await waitFor(() => expect(ultimaConsulta(port).formasCobro).toEqual(["transferencia"]));
    expect(ultimaConsulta(port).registradoPor).toEqual([]);
    expect(screen.queryByRole("button", { name: "Llegaron tarde" })).not.toBeInTheDocument();
  });

  it("guardar una vista y volver a ella", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: "Sin GPS" }));
    await user.click(screen.getByRole("button", { name: "Guardar vista" }));
    await user.type(screen.getByLabelText("Nombre de la vista"), "Sin GPS de Juan");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByRole("button", { name: "Sin GPS de Juan" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(ultimaConsulta(port).conGps).toBeNull());
    await user.click(screen.getByRole("button", { name: "Sin GPS de Juan" }));
    await waitFor(() => expect(ultimaConsulta(port).conGps).toBe(false));
  });

  it("columnas: mostrar 'Forma de cobro' y recordarlo", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.queryByRole("columnheader", { name: "Forma de cobro" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Forma de cobro" }));
    expect(screen.getByRole("columnheader", { name: "Forma de cobro" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CLAVE_COLUMNAS)!)).toContain("forma");
  });

  it("'Llegó al servidor' marca la captura tardía que decidió el servidor", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Llegó al servidor" }));
    const visita = screen.getByText("MARÍA ELENA CUAUTLE TLAPA").closest("tr")!;
    expect(within(visita).getByText("mié 14 oct · 10:58")).toBeInTheDocument();
    expect(within(visita).getByTitle("Llegó tarde al servidor")).toBeInTheDocument();
    const pago = screen.getByText("JUANA ANDRADE LECHUGA").closest("tr")!;
    expect(within(pago).queryByTitle("Llegó tarde al servidor")).not.toBeInTheDocument();
  });

  it("ordenar por cliente lo pide al servidor y alterna la dirección", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: /^Cliente/ }));
    await waitFor(() => expect(ultimaConsulta(port)).toMatchObject({ orden: "cliente", dir: "asc" }));
    await user.click(screen.getByRole("button", { name: /^Cliente/ }));
    await waitFor(() => expect(ultimaConsulta(port)).toMatchObject({ orden: "cliente", dir: "desc" }));
  });

  it("agrupar por día pone encabezados sin sumas", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.selectOptions(screen.getByLabelText("Agrupar"), "dia");
    await waitFor(() => expect(ultimaConsulta(port).orden).toBe("hora"));
    const grupos = await screen.findAllByTestId("grupo");
    expect(grupos[0]).toHaveTextContent("miércoles 14 de octubre");
    expect(grupos[0].textContent).not.toMatch(/\$/);
  });

  it("Mostrar 100 más sigue el cursor", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.actividadResponse = (pagina) =>
      pagina.cursor === null
        ? makePaginaActividad({ siguienteCursor: "c2" })
        : makePaginaActividad({
            items: [makeActividadPago({ id: "pago:1", clienteNombre: "HUGO NAVA CARRERA" })],
            siguienteCursor: null,
          });
    montar(port);
    await user.click(await screen.findByRole("button", { name: "Mostrar 100 más" }));
    expect(await screen.findByText("HUGO NAVA CARRERA")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mostrar 100 más" })).not.toBeInTheDocument();
  });

  it("sin exportación a Excel en esta fase", async () => {
    montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.queryByRole("button", { name: "Excel" })).not.toBeInTheDocument();
  });

  it("el folio abre la venta (también de una visita) sin abrir la actividad", async () => {
    const user = userEvent.setup();
    const onAbrirVenta = vi.fn();
    const { onAbrirActividad } = montar(new FakeDesempenoPort(), vi.fn(), onAbrirVenta);
    await user.click(await screen.findByRole("button", { name: "Ver venta Z1680412" }));
    expect(onAbrirVenta).toHaveBeenCalledWith({ clienteId: 1602231, doctoPvId: 9934 });
    expect(onAbrirActividad).not.toHaveBeenCalled();
  });

  it("clic en un renglón abre la actividad; sin resultados lo dice", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    const { onAbrirActividad } = montar(port);
    await user.click(await screen.findByText("JUANA ANDRADE LECHUGA"));
    expect(onAbrirActividad).toHaveBeenCalledWith(expect.objectContaining({ id: "pago:15082369" }));

    port.actividadResponse = makePaginaActividad({
      items: [],
      totales: { n: 0, importe: "0.00", porTipo: { pago: 0, visita: 0, condonacion: 0 } },
    });
    await user.selectOptions(screen.getByLabelText("Tipo"), "condonacion");
    expect(await screen.findByText("Ningún movimiento con estos filtros")).toBeInTheDocument();
  });

  it("agrupar por cliente pide al servidor el orden por cliente", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.selectOptions(screen.getByLabelText("Agrupar"), "cliente");
    await waitFor(() => expect(ultimaConsulta(port)).toMatchObject({ orden: "cliente", dir: "asc" }));
  });

  it("ordenar por otra columna con agrupación activa quita la agrupación", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.selectOptions(screen.getByLabelText("Agrupar"), "tipo");
    await screen.findAllByTestId("grupo");
    await user.click(screen.getByRole("button", { name: /^Cliente/ }));
    await waitFor(() => expect(ultimaConsulta(port).orden).toBe("cliente"));
    expect(screen.getByLabelText("Agrupar")).toHaveValue("");
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.queryAllByTestId("grupo")).toHaveLength(0);
  });

  it("los totales son los del servidor aunque no coincidan con los renglones de la página", async () => {
    const port = new FakeDesempenoPort();
    port.actividadResponse = makePaginaActividad({
      siguienteCursor: "c2",
      totales: { n: 1188, importe: "289450.00", porTipo: { pago: 980, visita: 200, condonacion: 8 } },
    });
    montar(port);
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.getByText("1,188 movimientos")).toBeInTheDocument();
    expect(screen.getByText("980 pagos")).toBeInTheDocument();
    expect(screen.getByText("200 visitas")).toBeInTheDocument();
    expect(screen.getByText("8 condonaciones")).toBeInTheDocument();
    expect(screen.getByText("cobrado $289,450")).toBeInTheDocument();
  });

  it("la tabla respeta el orden del servidor (no reordena en pantalla)", async () => {
    const port = new FakeDesempenoPort();
    port.actividadResponse = makePaginaActividad({
      items: [
        makeActividadPago({ id: "pago:1", clienteNombre: "ZENAIDA ROJAS" }),
        makeActividadPago({ id: "pago:2", clienteNombre: "ABEL MORA" }),
        makeActividadPago({ id: "pago:3", clienteNombre: "MARTA LUNA" }),
      ],
    });
    montar(port);
    await screen.findByText("ZENAIDA ROJAS");
    const filas = screen.getAllByRole("row").slice(1).map((r) => r.textContent ?? "");
    expect(filas[0]).toContain("ZENAIDA ROJAS");
    expect(filas[1]).toContain("ABEL MORA");
    expect(filas[2]).toContain("MARTA LUNA");
  });

  it("una vista guardada restaura también sus columnas", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Forma de cobro" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Guardar vista" }));
    await user.type(screen.getByLabelText("Nombre de la vista"), "Con forma");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Forma de cobro" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("columnheader", { name: "Forma de cobro" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Con forma" }));
    expect(await screen.findByRole("columnheader", { name: "Forma de cobro" })).toBeInTheDocument();
  });

  it("'Forma de cobro' usa la etiqueta del catálogo del API", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.catalogosResponse = makeCatalogos({
      formasCobro: [{ codigo: "efectivo", etiqueta: "Efectivo en ruta" }],
    });
    montar(port);
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Forma de cobro" }));
    const fila = screen.getByText("JUANA ANDRADE LECHUGA").closest("tr")!;
    expect(await within(fila).findByText("Efectivo en ruta")).toBeInTheDocument();
  });

  it("un renglón se abre con el teclado", async () => {
    const onAbrirActividad = vi.fn();
    montar(new FakeDesempenoPort(), onAbrirActividad);
    const fila = (await screen.findByText("JUANA ANDRADE LECHUGA")).closest("tr")!;
    expect(fila).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(fila, { key: "Enter" });
    fireEvent.keyDown(fila, { key: " " });
    expect(onAbrirActividad).toHaveBeenCalledTimes(2);
  });

  it("un monto que no es número avisa y no se manda", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    const llamadas = port.actividadCalls.length;
    await user.type(screen.getByLabelText("Monto mínimo"), "12,5x");
    await user.tab();
    expect(screen.getByText("el monto debe ser un número, como 150 o 150.50")).toBeInTheDocument();
    expect(port.actividadCalls).toHaveLength(llamadas);

    await user.clear(screen.getByLabelText("Monto mínimo"));
    await user.type(screen.getByLabelText("Monto mínimo"), "150.50");
    await user.tab();
    await waitFor(() => expect(ultimaConsulta(port).montoMin).toBe("150.50"));
    expect(screen.queryByText(/el monto debe ser un número/)).not.toBeInTheDocument();
  });

  it("cambiar las fechas no borra lo que se está escribiendo en la búsqueda", async () => {
    const user = userEvent.setup();
    const { port } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    await user.type(screen.getByLabelText("Buscar cliente o folio"), "andr");
    fireEvent.change(screen.getByLabelText("Del"), { target: { value: "2026-10-13" } });
    expect(screen.getByLabelText("Buscar cliente o folio")).toHaveValue("andr");
    await waitFor(() => expect(ultimaConsulta(port)).toMatchObject({ q: "andr", desde: "2026-10-13T06:00:00Z" }));
  });

  it("sin fechas muestra el rango por defecto del API: semana del usuario hasta ahora", async () => {
    montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.getByText("Semana en curso · desde vie 9 oct")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Del"), { target: { value: "2026-10-13" } });
    expect(screen.queryByText("Semana en curso · desde vie 9 oct")).not.toBeInTheDocument();
  });

  it("usuario sin configurar (409): estado propio, sin Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.listarActividad = new DomainError(
      "desempeno_usuario_sin_inicio_semana",
      "el usuario no tiene inicio de semana",
    );
    montar(port);
    expect(await screen.findByText("Sin configurar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurar en Usuarios" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("una visita sin forma de cobro no muestra forma", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.actividadResponse = makePaginaActividad({ items: [makeActividadVisita()] });
    montar(port);
    await screen.findByText("MARÍA ELENA CUAUTLE TLAPA");
    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("checkbox", { name: "Forma de cobro" }));
    const fila = screen.getByText("MARÍA ELENA CUAUTLE TLAPA").closest("tr")!;
    expect(within(fila).getAllByText("—").length).toBeGreaterThan(0);
  });
});
