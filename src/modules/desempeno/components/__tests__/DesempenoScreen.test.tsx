import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { DesempenoScreen } from "../DesempenoScreen";
import { DesempenoProvider } from "../../presentation/context/DesempenoProvider";
import {
  FakeDesempenoPort,
  makeTablero,
  makeUsuarioSinConfigurar,
  makeUsuarioTablero,
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

function montar(ruta = "/", port = new FakeDesempenoPort(), puedeConfigurar = true) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <DesempenoProvider port={port}>
        <DesempenoScreen puedeConfigurar={puedeConfigurar} />
      </DesempenoProvider>
      <Ubicacion />
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

  it("Actividad: 'Registró' ofrece solo usuarios de la misma zona y Oficina", async () => {
    montar("/?usuario=uid-juan&pestana=actividad");
    const select = await screen.findByLabelText("Registró");
    expect(within(select).getByRole("option", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Oficina" })).toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: "Rosa Isela Pacheco" })).not.toBeInTheDocument();
  });

  it("usuario inexistente: lo dice y ofrece volver al equipo", async () => {
    const user = userEvent.setup();
    montar("/?usuario=uid-nadie");
    expect(await screen.findByText("No encontramos a este usuario")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al equipo" }));
    expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/$/);
  });

  it("usuario sin zona: explica por qué no hay ficha y enlaza a Usuarios", async () => {
    montar("/?usuario=uid-norma");
    expect(await screen.findByText(/No tiene zona asignada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configurar/ })).toHaveAttribute("href", "/settings");
  });

  it("inicio de semana en el futuro (contrato v2.1): lo explica, sin enlace si no puede configurar", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      usuarios: [makeUsuarioTablero(), makeUsuarioSinConfigurar({ motivoNoConfigurado: "inicio_semana_futuro" })],
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
    // La consulta de Semana se queda en vuelo: mientras, la ficha sigue ahí.
    port.tableroResponse = () =>
      new Promise((r) => {
        liberar = () => r(makeTablero({ periodo: "semana" }));
      });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar cliente o folio")).toHaveValue("JUANA");
    liberar();
    expect(await screen.findByText("Cobrado en la semana")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar cliente o folio")).toHaveValue("JUANA");
  });

  it("si falla la recarga con datos previos: aviso discreto con la hora de los datos, la ficha sigue", async () => {
    const user = userEvent.setup();
    const port = montar("/?usuario=uid-juan&pestana=actividad");
    await screen.findByRole("heading", { name: "Juan Carlos Méndez" });
    port.throwOnNext.obtenerTablero = new Error("se cayó");
    port.tableroResponse = makeTablero({ periodo: "semana" });
    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(await screen.findByText("No se pudo actualizar · datos de 16:40")).toBeInTheDocument();
    expect(screen.queryByText("No se pudo cargar la ficha")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Juan Carlos Méndez" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Cobrado en la semana")).toBeInTheDocument();
    expect(screen.queryByText(/No se pudo actualizar/)).not.toBeInTheDocument();
  });

  it("si el tablero no carga, la ficha muestra el error con Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerTablero = new Error("se cayó");
    montar("/?usuario=uid-juan", port);
    expect(await screen.findByText("No se pudo cargar la ficha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeInTheDocument();
  });
});
