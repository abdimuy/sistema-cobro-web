import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapaJornada } from "../MapaJornada";
import { makeActividadPago } from "../../../application/__tests__/fakeDesempenoPort";

vi.mock("../MapaJornadaGoogle", () => ({
  MapaJornadaGoogle: ({
    puntos,
    trayecto,
    rango,
  }: {
    puntos: Array<{ id: string; minutos: number }>;
    trayecto: boolean;
    rango: readonly [number, number] | null;
  }) => (
    <div
      data-testid="mapa-google"
      data-trayecto={String(trayecto)}
      data-visibles={puntos.filter((p) => !rango || (p.minutos >= rango[0] && p.minutos <= rango[1])).length}
    />
  ),
}));

const act = (id: string, hora: string) =>
  makeActividadPago({ id, hora, conGps: true, lat: 18.46, lng: -97.39 });
// 15:00Z = 09:00 CDMX, 17:00Z = 11:00, 19:00Z = 13:00.
const actividades = [act("a", "2026-10-14T15:00:00Z"), act("b", "2026-10-14T17:00:00Z"), act("c", "2026-10-14T19:00:00Z")];

function montar() {
  return render(<MapaJornada actividades={actividades} etiquetaDia="mié 14 oct" onSeleccionar={vi.fn()} />);
}

describe("MapaJornada", () => {
  beforeEach(() => localStorage.clear());

  it("el trayecto está apagado por omisión, el interruptor lo enciende y se recuerda", async () => {
    const user = userEvent.setup();
    const { unmount } = montar();
    expect((await screen.findByTestId("mapa-google")).dataset.trayecto).toBe("false");
    await user.click(screen.getByRole("switch", { name: "Trayecto" }));
    expect(screen.getByTestId("mapa-google").dataset.trayecto).toBe("true");
    unmount();
    montar();
    expect((await screen.findByTestId("mapa-google")).dataset.trayecto).toBe("true");
  });

  it("el slider filtra los puntos visibles y 'Todo' restaura", async () => {
    const user = userEvent.setup();
    montar();
    const mapa = await screen.findByTestId("mapa-google");
    expect(mapa.dataset.visibles).toBe("3");
    expect(screen.getByText("09:00 – 13:00")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: "Desde" }), { target: { value: String(10 * 60) } });
    expect(screen.getByText("10:00 – 13:00")).toBeInTheDocument();
    expect(screen.getByTestId("mapa-google").dataset.visibles).toBe("2");
    await user.click(screen.getByRole("button", { name: "Todo" }));
    expect(screen.getByTestId("mapa-google").dataset.visibles).toBe("3");
    expect(screen.getByText("09:00 – 13:00")).toBeInTheDocument();
  });

  it("la leyenda fusiona Inicio/Fin cuando están en el mismo lugar", async () => {
    montar();
    await screen.findByTestId("mapa-google");
    expect(screen.getByText("Inicio/Fin")).toBeInTheDocument();
  });

  it("Ampliar abre el recorrido en un diálogo con su propio mapa", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByTestId("mapa-google");
    await user.click(screen.getByRole("button", { name: "Ampliar el recorrido" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByTestId("mapa-google")).toHaveLength(2);
  });
});
