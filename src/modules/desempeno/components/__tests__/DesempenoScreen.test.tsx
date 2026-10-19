import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { DesempenoScreen } from "../DesempenoScreen";
import { DomainError } from "../../domain/errors";
import type { FichaUsuario } from "../../domain/entities";
import { DesempenoProvider } from "../../presentation/context/DesempenoProvider";
import {
  FakeDesempenoPort,
  makeFichaUsuario,
  makeJornada,
  makeLinea,
  makeTramo,
  makeUsuarioSinConfigurar,
  makeUsuarioFicha,
  usuarioFichaDe,
} from "../../application/__tests__/fakeDesempenoPort";

// Los modales de Clientes se sustituyen para leer con qué ids se abrieron.
// La prueba con el PagoModal REAL (fotos) está en DesempenoScreen.clientes.test.tsx.
vi.mock("@/modules/clientes", () => ({
  PagoModal: (p: { clienteId: number; doctoCcId: number }) => (
    <div data-testid="pago-modal">{`${p.clienteId}-${p.doctoCcId}`}</div>
  ),
  VentaModal: (p: { clienteId: number; doctoPvId: number }) => (
    <div data-testid="venta-modal">{`${p.clienteId}-${p.doctoPvId}`}</div>
  ),
  ClienteFicha: (p: { clienteId: number }) => <div data-testid="cliente-ficha">{p.clienteId}</div>,
}));
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));
vi.mock("../jornada/MapaJornadaGoogle", () => ({
  MapaJornadaGoogle: () => <div data-testid="mapa-google" />,
}));

function Ubicacion() {
  const l = useLocation();
  return <div data-testid="ubicacion">{`${l.pathname}${l.search}`}</div>;
}

function IrA({ ruta }: { ruta: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(ruta)}>
      ir-a-otra-ficha
    </button>
  );
}

function montar(ruta = "/", port = new FakeDesempenoPort(), puedeConfigurar = true) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <DesempenoProvider port={port}>
        <DesempenoScreen puedeConfigurar={puedeConfigurar} />
      </DesempenoProvider>
      <Ubicacion />
      <IrA ruta="/?usuario=uid-otro" />
    </MemoryRouter>,
  );
  return port;
}

describe("DesempenoScreen (carriles conectados)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Solo el reloj: "hoy" de negocio es el 14-oct-2026 (16:40 en CDMX).
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T22:40:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("tablero → ficha por la URL (?usuario=) y de regreso con Equipo", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(await screen.findByText("$8,600"));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("/?usuario=uid-juan");
    expect(await screen.findByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Equipo/ }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/$/);
    expect(await screen.findByRole("heading", { name: "Desempeño de cobradores" })).toBeInTheDocument();
  });

  it("deep-link: ?usuario= abre la ficha directo, con la pestaña y el día de la URL", async () => {
    const port = montar("/?usuario=uid-juan&pestana=jornada&dia=2026-10-13");
    expect(await screen.findByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Jornada" })).toHaveAttribute("aria-selected", "true");
    await screen.findByRole("list", { name: "Movimientos en orden" });
    expect(port.jornadaCalls[port.jornadaCalls.length - 1]).toMatchObject({ uid: "uid-juan", fecha: "2026-10-13" });
  });

  it("la línea del día usa el eje que manda el servidor, no uno fijo (E-INF eje)", async () => {
    const port = new FakeDesempenoPort();
    // 18:00Z = 12:00 en CDMX. Eje 5–22 h: (12-5)/17 = 41.18 %. Con 7–20 sería 38.46 %.
    port.jornadaResponse = makeJornada({
      eje: { desdeHora: 5, hastaHora: 22 },
      linea: makeLinea({
        tramos: [makeTramo({ desde: "2026-10-14T18:00:00Z", hasta: "2026-10-14T19:00:00Z" })],
      }),
    });
    montar("/?usuario=uid-juan&dia=2026-10-14", port);
    const tramo = await screen.findByTestId("tramo");
    expect(parseFloat(tramo.style.left)).toBeCloseTo((7 / 17) * 100, 1);
  });

  it("al pasar a otra ficha no queda abierto el modal de la anterior", async () => {
    const user = userEvent.setup();
    const port = montar("/?usuario=uid-juan&dia=2026-10-14");
    await user.click(await screen.findByText("JUANA ANDRADE LECHUGA"));
    expect(screen.getByTestId("pago-modal")).toBeInTheDocument();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({ uid: "uid-otro", nombre: "Otra Persona" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "ir-a-otra-ficha", hidden: true }));
    expect(await screen.findByRole("heading", { name: "Otra Persona" })).toBeInTheDocument();
    expect(screen.queryByTestId("pago-modal")).not.toBeInTheDocument();
  });

  it("un día inválido o futuro en la URL cae en hoy", async () => {
    const port = montar("/?usuario=uid-juan&dia=2026-10-20");
    await screen.findByRole("list", { name: "Movimientos en orden" });
    expect(port.jornadaCalls[port.jornadaCalls.length - 1]?.fecha).toBe("2026-10-14");
  });

  it("cambiar de día escribe el día en la URL", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan");
    await screen.findByRole("list", { name: "Movimientos en orden" });
    await user.click(screen.getByRole("button", { name: /Día anterior/ }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("dia=2026-10-13");
  });

  it("la jornada recibe la línea y la vista del carril 1 y las fotos del carril 3", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan&dia=2026-10-14");
    expect(await screen.findByTestId("linea-actividad")).toHaveAttribute("data-vista", "bloques");
    expect(screen.getByRole("button", { name: "Bloques de trabajo" })).toBeInTheDocument();
    // La celda de fotos conectada es CeldaFotos (carril 3): su popover dice "1 foto".
    const renglon = (await screen.findByText("PEDRO TEHUITZIL ZEPEDA")).closest("li")!;
    await user.hover(within(renglon).getByText("1"));
    expect(await screen.findByText("1 foto")).toBeInTheDocument();
  });

  it("un pago abre el PagoModal de Clientes y una visita el modal de visita con su galería", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan&dia=2026-10-14");
    await user.click(await screen.findByText("JUANA ANDRADE LECHUGA"));
    expect(screen.getByTestId("pago-modal")).toHaveTextContent("1544855-15082369");
    await user.click(screen.getByText("MARÍA ELENA CUAUTLE TLAPA"));
    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByText("Visitas")).toBeInTheDocument();
    expect(await within(modal).findByAltText("Recibo firmado")).toBeInTheDocument();
  });

  it("el folio de un movimiento abre el detalle de venta de Clientes (onAbrirVenta)", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan&dia=2026-10-14");
    await user.click(await screen.findByRole("button", { name: "Ver venta Z1677035" }));
    expect(screen.getByTestId("venta-modal")).toHaveTextContent("1544855-9921");
    // El clic en el folio no abre además el pago del renglón.
    expect(screen.queryByTestId("pago-modal")).not.toBeInTheDocument();
  });

  it("el folio también abre la venta desde la pestaña Actividad", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan&pestana=actividad");
    await user.click(await screen.findByRole("button", { name: "Ver venta Z1680412" }));
    expect(screen.getByTestId("venta-modal")).toHaveTextContent("1602231-9934");
  });

  it("Cuentas: la pestaña va en la URL y la cuenta abre el VentaModal", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-juan&dia=2026-10-14");
    await user.click(await screen.findByRole("tab", { name: /Cuentas de la semana/ }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("pestana=cuentas");
    await user.click(await screen.findByText("GERARDO XICALE ANALCO"));
    expect(screen.getByTestId("venta-modal")).toHaveTextContent("1610045-9950");
  });

  it("Actividad: 'Registró' ofrece a quienes aparecen en los movimientos cargados", async () => {
    montar("/?usuario=uid-juan&pestana=actividad");
    const select = await screen.findByLabelText("Registró");
    await waitFor(() =>
      expect(within(select).getByRole("option", { name: "JUAN CARLOS MENDEZ" })).toBeInTheDocument(),
    );
    expect(within(select).queryByRole("option", { name: "Oficina" })).not.toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: "Rosa Isela Pacheco" })).not.toBeInTheDocument();
  });

  it("usuario inexistente: lo dice y ofrece volver al equipo", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerUsuario = new DomainError("desempeno_usuario_not_found", "no existe el usuario");
    montar("/?usuario=uid-nadie", port);
    expect(await screen.findByText("No encontramos a este usuario")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al equipo" }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/$/);
  });

  it("usuario sin zona: explica por qué no hay ficha y enlaza a Usuarios", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({ usuario: usuarioFichaDe(makeUsuarioSinConfigurar()) });
    montar("/?usuario=uid-norma", port);
    expect(await screen.findByText(/No tiene zona asignada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configurar/ })).toHaveAttribute("href", "/settings");
  });

  it("inicio de semana en el futuro (contrato v2.1): lo explica, sin enlace si no puede configurar", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: usuarioFichaDe(makeUsuarioSinConfigurar({ motivoNoConfigurado: "inicio_semana_futuro" })),
    });
    montar("/?usuario=uid-norma", port, false);
    expect(await screen.findByText(/Su inicio de semana todavía no llega/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Configurar/ })).not.toBeInTheDocument();
  });

  it("cambiar Hoy/Semana en la ficha no la desmonta: lo tecleado en Actividad se queda", async () => {
    const user = userEvent.setup();
    let liberar: () => void = () => {};
    const port = montar("/?usuario=uid-juan&pestana=actividad");
    const buscar = await screen.findByLabelText("Buscar cliente o folio");
    await user.type(buscar, "JUANA");
    // La consulta de Semana se queda en vuelo: mientras, el marco sigue ahí.
    port.usuarioResponse = () =>
      new Promise((r) => {
        liberar = () => r(makeFichaUsuario({ periodo: "semana" }));
      });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar cliente o folio")).toHaveValue("JUANA");
    liberar();
    expect(await screen.findByText("Cobrado en la semana")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar cliente o folio")).toHaveValue("JUANA");
  });

  it("la ficha pide sólo a su usuario, nunca el tablero de la flota (T20)", async () => {
    const port = montar("/?usuario=uid-juan");
    await screen.findByRole("heading", { name: "Juan Carlos Méndez" });
    expect(port.tableroCalls).toHaveLength(0);
    expect(port.usuarioCalls[port.usuarioCalls.length - 1]?.uid).toBe("uid-juan");
  });

  it("toggle a Semana: se marca al instante, las cifras pasan a esqueleto, 'Cargando semana…' tras 1 s, nunca la cifra de Hoy (T20, D23)", async () => {
    const user = userEvent.setup();
    const port = montar("/?usuario=uid-juan");
    expect(await screen.findByText("$8,600")).toBeInTheDocument();
    let soltar: (f: FichaUsuario) => void = () => {};
    port.usuarioResponse = () =>
      new Promise<FichaUsuario>((r) => {
        soltar = r;
      });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("$8,600")).not.toBeInTheDocument();
    expect(screen.getByTestId("ficha-esqueleto")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.queryByText("Cargando semana…")).not.toBeInTheDocument();
    expect(await screen.findByText("Cargando semana…", {}, { timeout: 2500 })).toBeInTheDocument();
    expect(screen.queryByText("$8,600")).not.toBeInTheDocument();
    act(() =>
      soltar(
        makeFichaUsuario({
          periodo: "semana",
          usuario: makeUsuarioFicha({ pagos: { n: 20, importe: "3000.00" } }),
        }),
      ),
    );
    expect(await screen.findByText("$3,000")).toBeInTheDocument();
    expect(screen.queryByTestId("ficha-esqueleto")).not.toBeInTheDocument();
  });

  it("respuesta fuera de orden: la de Semana llega tarde, ya con Hoy elegido, y no se pinta (Review Focus 4)", async () => {
    const user = userEvent.setup();
    const port = montar("/?usuario=uid-juan");
    await screen.findByText("$8,600");
    const pendientes: Array<(f: FichaUsuario) => void> = [];
    port.usuarioResponse = () =>
      new Promise<FichaUsuario>((r) => {
        pendientes.push(r);
      });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    await user.click(screen.getByRole("button", { name: "Hoy" }));
    await act(async () => {
      pendientes[0](
        makeFichaUsuario({
          periodo: "semana",
          usuario: makeUsuarioFicha({ pagos: { n: 20, importe: "3000.00" } }),
        }),
      );
    });
    expect(screen.queryByText("$3,000")).not.toBeInTheDocument();
    expect(screen.queryByText("$8,600")).not.toBeInTheDocument();
    await act(async () => {
      pendientes[1](makeFichaUsuario({ periodo: "hoy" }));
    });
    expect(await screen.findByText("$8,600")).toBeInTheDocument();
  });

  it("si falla la carga: 'No se pudo cargar' con Reintentar", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerUsuario = new DomainError("desempeno_no_disponible", "la base de datos no respondió a tiempo");
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText("No se pudo cargar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(port.usuarioCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("si falla la carga de Semana con el marco puesto: 'No se pudo cargar' y Reintentar sin cifras de Hoy", async () => {
    const user = userEvent.setup();
    const port = montar("/?usuario=uid-juan");
    await screen.findByText("$8,600");
    port.throwOnNext.obtenerUsuario = new DomainError("desempeno_no_disponible", "la base de datos no respondió a tiempo");
    port.usuarioResponse = makeFichaUsuario({ periodo: "semana" });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(await screen.findByText("No se pudo cargar")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(screen.queryByText("$8,600")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Cobrado en la semana")).toBeInTheDocument();
  });

  it("si falla la actualización con datos del mismo periodo: aviso discreto con la hora de los datos, la ficha sigue", async () => {
    const port = new FakeDesempenoPort();
    montar("/?usuario=uid-juan&pestana=actividad", port);
    await screen.findByRole("heading", { name: "Juan Carlos Méndez" });
    // El tick de cada minuto reintenta la misma consulta (refresh).
    port.throwOnNext.obtenerUsuario = new Error("se cayó");
    vi.useRealTimers();
    // refresh se dispara con el botón Reintentar del aviso, que solo existe tras fallar:
    // se fuerza con la visibilidad de la ventana (useCadaMinuto refresca al volver).
    await act(async () => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await screen.findByText("No se pudo actualizar · datos de 16:40")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
  });

  it("semana vencida: aviso con inicio y último movimiento, tarjetas en — y sin cifras (T20, D19)", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({
        semanaVencida: true,
        inicioSemana: "2025-11-11T14:00:00Z",
        ultimoMovimiento92Dias: { id: "visita:x", tipo: "visita", hora: "2026-09-05T16:00:00Z" },
        pagos: { n: 0, importe: "0.00" },
      }),
    });
    montar("/?usuario=uid-juan", port);
    expect(
      await screen.findByText("Semana vencida · inicio mar 11 nov · último movimiento sáb 5 sep"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(7);
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
  });

  // Etiqueta de un chip de día ("lun 12", "sáb 10"); ver NavegadorDia.
  const CHIP_DIA = /^(lun|mar|mié|jue|vie|sáb|dom) \d{1,2}$/;

  it("control positivo del patrón de chip: con días navegables sí los encuentra", async () => {
    const port = new FakeDesempenoPort();
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: CHIP_DIA })).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Día anterior" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("ubicacion")).toHaveTextContent("dia=2026-10-13");
  });

  // Decisión del dueño (2026-10-19): semana vencida = dias_navegables: [] del
  // servidor; la ficha no pinta botones de día y la Jornada sigue en el día de
  // hoy del servidor (o el de la URL), nunca en un día vacío.
  it("semana vencida con dias_navegables []: sin chips de día, aviso visible y la jornada de hoy carga", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({ semanaVencida: true, inicioSemana: "2025-11-11T14:00:00Z" }),
      inicioSemanaDia: "2025-11-11",
      diasNavegables: [],
    });
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText(/^Semana vencida · inicio mar 11 nov/)).toBeInTheDocument();
    expect(await screen.findByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inicio de semana" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: CHIP_DIA })).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Día anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Día siguiente" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("ubicacion")).not.toHaveTextContent("dia=");
    expect(port.jornadaCalls.length).toBeGreaterThan(0);
    expect(port.jornadaCalls.every((c) => c.fecha === "2026-10-14")).toBe(true);
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  it("semana vencida con dias_navegables [] y la jornada en 409 semana_vencida: aviso propio, sin Reintentar ni chips", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({ semanaVencida: true, inicioSemana: "2025-11-11T14:00:00Z" }),
      inicioSemanaDia: "2025-11-11",
      diasNavegables: [],
    });
    port.throwOnNext.obtenerJornada = new DomainError(
      "desempeno_semana_vencida",
      "el inicio de semana del usuario tiene más de 14 días",
    );
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText("el inicio de semana del usuario tiene más de 14 días")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inicio de semana" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: CHIP_DIA })).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Día anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Día siguiente" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("ubicacion")).not.toHaveTextContent("dia=");
    expect(document.querySelector(".animate-pulse")).toBeNull();
  });

  // Sin navegación por días (decisión del coordinador): en la ficha vencida el
  // ?dia= de la URL no cuenta; la Jornada carga el hoy del servidor.
  it("semana vencida con ?dia= viejo en la URL: la jornada carga hoy y nunca pide ese día", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({ semanaVencida: true, inicioSemana: "2025-11-11T14:00:00Z" }),
      inicioSemanaDia: "2025-11-11",
      diasNavegables: [],
    });
    montar("/?usuario=uid-juan&dia=2026-10-01", port);
    expect(await screen.findByText("JUANA ANDRADE LECHUGA")).toBeInTheDocument();
    expect(port.jornadaCalls.length).toBeGreaterThan(0);
    expect(port.jornadaCalls.map((c) => c.fecha)).not.toContain("2026-10-01");
    expect(port.jornadaCalls.every((c) => c.fecha === "2026-10-14")).toBe(true);
  });

  it("control positivo: en una ficha normal el ?dia= de la URL sí se respeta", async () => {
    const port = new FakeDesempenoPort();
    montar("/?usuario=uid-juan&dia=2026-10-01", port);
    await waitFor(() => expect(port.jornadaCalls.length).toBeGreaterThan(0));
    expect(port.jornadaCalls.every((c) => c.fecha === "2026-10-01")).toBe(true);
  });

  it("semana vencida sin movimiento en 92 días lo dice", async () => {
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({
      usuario: makeUsuarioFicha({ semanaVencida: true, ultimoMovimiento92Dias: null }),
    });
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText(/último movimiento sin movimiento en 92 días/)).toBeInTheDocument();
  });

  it("el día de la URL se acota con el hoy del servidor, no con el reloj de la Mac (T20, D10)", async () => {
    // Ya es 16 en UTC y en la Mac simulada, todavía 15 en CDMX: el servidor dice 15.
    vi.setSystemTime(new Date("2026-10-16T05:30:00Z"));
    const port = new FakeDesempenoPort();
    port.usuarioResponse = makeFichaUsuario({ hoy: "2026-10-15" });
    montar("/?usuario=uid-juan&dia=2026-10-16", port);
    await screen.findByRole("heading", { name: "Juan Carlos Méndez" });
    await screen.findByRole("list", { name: "Movimientos en orden" });
    expect(port.jornadaCalls[port.jornadaCalls.length - 1]?.fecha).toBe("2026-10-15");
  });

  it("usuario de zona excluida (409): lo dice con el mensaje del servidor y ofrece volver", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerUsuario = new DomainError(
      "desempeno_zona_excluida",
      "la zona del usuario está excluida de desempeño",
    );
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText("la zona del usuario está excluida de desempeño")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver al equipo" })).toBeInTheDocument();
  });
});
