import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JornadaTab } from "../JornadaTab";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeActividadPago,
  makeJornada,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";

vi.mock("../MapaJornadaGoogle", () => ({
  MapaJornadaGoogle: ({ puntos }: { puntos: Array<{ n: number }> }) => (
    <div data-testid="mapa-google">{puntos.map((p) => p.n).join(",")}</div>
  ),
}));

function montar(
  opciones: {
    port?: FakeDesempenoPort;
    dia?: string;
    onAbrirVenta?: (v: { clienteId: number; doctoPvId: number }) => void;
  } = {},
) {
  const onCambiarDia = vi.fn();
  const onAbrirActividad = vi.fn();
  const port = opciones.port ?? new FakeDesempenoPort();
  renderConDesempeno(
    <JornadaTab
      usuario={makeUsuarioTablero()}
      dia={opciones.dia ?? "2026-10-14"}
      hoy="2026-10-14"
      onCambiarDia={onCambiarDia}
      onAbrirActividad={onAbrirActividad}
      onAbrirVenta={opciones.onAbrirVenta}
    />,
    { port },
  );
  return { port, onCambiarDia, onAbrirActividad };
}

describe("JornadaTab", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllEnvs());

  it("lista en orden con la hora de la oficina y la pausa intercalada después de su actividad", async () => {
    montar();
    const lista = await screen.findByRole("list", { name: "Movimientos en orden" });
    const renglones = within(lista).getAllByRole("listitem");
    const textos = renglones.map((r) => r.textContent ?? "");
    const iPago0910 = textos.findIndex(
      (t) => t.includes("09:10") && t.includes("PEDRO TEHUITZIL ZEPEDA"),
    );
    expect(textos[0]).toContain("08:20");
    expect(textos[iPago0910 + 1]).toContain("Pausa · 1 h 12 min (09:10–10:22)");
    expect(textos[iPago0910 + 2]).toContain("ARACELI CORTÉS LUNA");
  });

  it("clic en un renglón abre la actividad", async () => {
    const user = userEvent.setup();
    const { onAbrirActividad } = montar();
    await user.click(await screen.findByText("MARÍA ELENA CUAUTLE TLAPA"));
    expect(onAbrirActividad).toHaveBeenCalledWith(
      expect.objectContaining({ id: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e" }),
    );
  });

  it("marca la actividad sin GPS y la que llegó tarde al servidor (señal del API)", async () => {
    montar();
    const renglon = (await screen.findByText("MARÍA ELENA CUAUTLE TLAPA")).closest("li")!;
    expect(within(renglon).getByTitle("Sin GPS")).toBeInTheDocument();
    expect(within(renglon).getByTitle("Llegó tarde al servidor")).toBeInTheDocument();
    const aTiempo = screen.getByText("JUANA ANDRADE LECHUGA").closest("li")!;
    expect(within(aTiempo).queryByTitle("Llegó tarde al servidor")).not.toBeInTheDocument();
  });

  it("el folio de una visita abre la venta con el docto_pv_id del API, sin abrir la visita", async () => {
    const user = userEvent.setup();
    const onAbrirVenta = vi.fn();
    const { onAbrirActividad } = montar({ onAbrirVenta });
    await user.click(await screen.findByRole("button", { name: "Ver venta Z1680412" }));
    expect(onAbrirVenta).toHaveBeenCalledWith({ clienteId: 1602231, doctoPvId: 9934 });
    expect(onAbrirActividad).not.toHaveBeenCalled();
  });

  it("sin docto_pv_id el folio es solo texto", async () => {
    const port = new FakeDesempenoPort();
    port.jornadaResponse = makeJornada({
      actividades: [makeActividadPago({ doctoPvId: null })],
    });
    montar({ port, onAbrirVenta: vi.fn() });
    expect(await screen.findByText("Z1677035")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver venta Z1677035" })).not.toBeInTheDocument();
  });

  it("Para revisar: señales del API, regla en el popover y salto a la actividad", async () => {
    const user = userEvent.setup();
    montar();
    const senal = await screen.findByRole("button", { name: /Pausa larga/ });
    expect(within(senal).getByText("Pausa de 1 h 12 min")).toBeInTheDocument();

    await user.hover(senal);
    expect(
      await screen.findByText("hueco de 45 min o más entre dos movimientos"),
    ).toBeInTheDocument();

    await user.click(senal);
    const renglon = screen.getByText("PEDRO TEHUITZIL ZEPEDA").closest("li")!;
    expect(renglon).toHaveAttribute("data-resaltada", "true");
  });

  it("eje: un punto por actividad, con popover y clic", async () => {
    const user = userEvent.setup();
    const { onAbrirActividad } = montar();
    const puntos = await screen.findAllByTestId("eje-punto");
    expect(puntos).toHaveLength(5);
    await user.hover(puntos[0]);
    expect(await screen.findByText("Pago · $150")).toBeInTheDocument();
    await user.click(puntos[0]);
    expect(onAbrirActividad).toHaveBeenCalled();
  });

  it("mapa con llave: solo las actividades con GPS, numeradas como en la lista", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "llave-de-prueba");
    montar();
    expect(await screen.findByTestId("mapa-google")).toHaveTextContent("1,3,4,5");
    expect(screen.getByText("1 sin GPS")).toBeInTheDocument();
  });

  it("mapa sin llave: aviso, no se rompe", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    montar();
    expect(await screen.findByText("Mapa no disponible")).toBeInTheDocument();
  });

  it("navegar días: anterior, chips de la semana y no se pasa de hoy", async () => {
    const user = userEvent.setup();
    const { onCambiarDia } = montar();
    await screen.findByText("JUANA ANDRADE LECHUGA");
    expect(screen.getByRole("button", { name: "Día siguiente" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Día anterior" }));
    expect(onCambiarDia).toHaveBeenCalledWith("2026-10-13");
    // Semana del usuario: desde vie 9 (inicio_semana 13:46Z = 07:46 CDMX) hasta hoy.
    await user.click(screen.getByRole("button", { name: "vie 9" }));
    expect(onCambiarDia).toHaveBeenCalledWith("2026-10-09");
  });

  it("día sin actividad", async () => {
    const port = new FakeDesempenoPort();
    port.jornadaResponse = makeJornada({
      actividades: [],
      senales: [],
      linea: { ...makeJornada().linea, puntos: [], tramos: [], pausas: [] },
    });
    montar({ port, dia: "2026-10-12" });
    expect(await screen.findByText("Sin actividad este día")).toBeInTheDocument();
    expect(screen.getByText("Nada que revisar este día")).toBeInTheDocument();
  });

  it("los huecos de la línea reciben la jornada y, hoy, la marca de ahora del API (generado_at)", async () => {
    const port = new FakeDesempenoPort();
    port.jornadaResponse = makeJornada({ generadoAt: "2026-10-14T22:41:00Z" });
    renderConDesempeno(
      <JornadaTab
        usuario={makeUsuarioTablero()}
        dia="2026-10-14"
        hoy="2026-10-14"
        onCambiarDia={vi.fn()}
        onAbrirActividad={vi.fn()}
        renderLinea={(j, ahora) => (
          <div data-testid="hueco-linea">{`${j.linea.puntos.length}|${ahora}`}</div>
        )}
        controlesLinea={<span>controles de vista</span>}
      />,
      { port },
    );
    expect(await screen.findByTestId("hueco-linea")).toHaveTextContent(
      "5|2026-10-14T22:41:00Z",
    );
    expect(screen.getByText("controles de vista")).toBeInTheDocument();
  });

  it("un día pasado no lleva marca de ahora", async () => {
    renderConDesempeno(
      <JornadaTab
        usuario={makeUsuarioTablero()}
        dia="2026-10-13"
        hoy="2026-10-14"
        onCambiarDia={vi.fn()}
        onAbrirActividad={vi.fn()}
        renderLinea={(_j, ahora) => <div data-testid="hueco-linea">{String(ahora)}</div>}
      />,
    );
    expect(await screen.findByTestId("hueco-linea")).toHaveTextContent("null");
  });

  it("error con Reintentar", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerJornada = new DomainError(
      "desempeno_usuario_sin_zona",
      "el usuario no tiene zona",
    );
    montar({ port });
    expect(await screen.findByText("el usuario no tiene zona")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(port.jornadaCalls).toHaveLength(2));
  });
});
