import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableroScreen } from "../TableroScreen";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeTablero,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import type { UltimoMovimiento } from "../../../domain/entities";

describe("semanas vencidas (D19, T19)", () => {
  beforeEach(() => localStorage.clear());

  // Contrato pulido 2 §4: la fecha de 92 días sale del lote al abrir "Ver N";
  // el ultimo_movimiento del tablero (null = nada en 7 días) no alimenta la fila.
  const SIN_92 = "Sin movimiento en 92 días";
  const vencidas = () =>
    makeTablero({
      usuarios: [
        makeUsuarioTablero({ uid: "u1", nombre: "Juan Carlos Méndez" }),
        makeUsuarioTablero({
          uid: "u2",
          nombre: "Iván Vázquez Aldama",
          semanaVencida: true,
          inicioSemana: "2025-11-11T14:00:00Z",
          movimientoUltimos7Dias: null,
        }),
        makeUsuarioTablero({ uid: "u3", nombre: "Ana Lilia Ortega", semanaVencida: true, movimientoUltimos7Dias: null }),
      ],
    });
  const lote = (entradas: Array<[string, UltimoMovimiento | null]>) => ({
    generadoAt: "2026-10-14T22:40:00Z",
    porUid: new Map(entradas),
  });
  const celda = (nombre: string) =>
    within(screen.getByRole("row", { name: `Abrir ficha de ${nombre}` })).getAllByRole("cell")[1];
  async function abrir(port: FakeDesempenoPort, n = 2) {
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    expect(await screen.findByText("Juan Carlos Méndez")).toBeInTheDocument();
    expect(screen.queryByText("Iván Vázquez Aldama")).not.toBeInTheDocument();
    expect(port.ultimosMovimientosCalls).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: `Ver ${n} sin actividad reciente` }));
  }

  it("no se piden hasta abrirlas; con el lote: fecha y null de 92 días", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = vencidas();
    port.ultimosMovimientosResponse = lote([
      ["u2", { id: "visita:x", tipo: "visita", hora: "2026-09-05T16:00:00Z" }],
      ["u3", null],
    ]);
    await abrir(port);
    expect(await screen.findByText("Último movimiento: sáb 5 sep")).toBeInTheDocument();
    expect(celda("Iván Vázquez Aldama")).toHaveTextContent(/^Último movimiento: sáb 5 sep$/);
    expect(celda("Ana Lilia Ortega")).toHaveTextContent(new RegExp(`^${SIN_92}$`));
    expect(port.ultimosMovimientosCalls.map((c) => c.uids)).toEqual([["u2", "u3"]]);
  });

  it("mientras carga dice 'Último movimiento: …', nunca el texto de 92 días", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = vencidas();
    port.ultimosMovimientosResponse = () => new Promise(() => {});
    await abrir(port);
    expect(celda("Iván Vázquez Aldama")).toHaveTextContent(/^Último movimiento: …$/);
    expect(celda("Ana Lilia Ortega")).toHaveTextContent(/^Último movimiento: …$/);
    expect(screen.queryByText(SIN_92)).not.toBeInTheDocument();
  });

  it("un uid que no vino en el lote dice 'Último movimiento: —'", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = vencidas();
    port.ultimosMovimientosResponse = lote([["u2", { id: "pago:1", tipo: "pago", hora: "2026-09-05T16:00:00Z" }]]);
    await abrir(port);
    await screen.findByText("Último movimiento: sáb 5 sep");
    expect(celda("Ana Lilia Ortega")).toHaveTextContent(/^Último movimiento: —$/);
    expect(screen.queryByText(SIN_92)).not.toBeInTheDocument();
  });

  it("si el lote falla dice 'Último movimiento: —', sin el texto de 92 días", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = vencidas();
    port.throwOnNext.obtenerUltimosMovimientos = new Error("se cayó");
    await abrir(port);
    await waitFor(() => expect(celda("Iván Vázquez Aldama")).toHaveTextContent(/^Último movimiento: —$/));
    expect(celda("Ana Lilia Ortega")).toHaveTextContent(/^Último movimiento: —$/);
    expect(screen.queryByText(SIN_92)).not.toBeInTheDocument();
  });

  it("el movimiento de 7 días del tablero no se pinta: manda el lote", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      usuarios: [
        makeUsuarioTablero({ uid: "u1", nombre: "Juan Carlos Méndez" }),
        makeUsuarioTablero({
          uid: "u2",
          nombre: "Iván Vázquez Aldama",
          semanaVencida: true,
          movimientoUltimos7Dias: { id: "pago:7", tipo: "pago", hora: "2026-10-12T16:00:00Z" },
        }),
      ],
    });
    port.ultimosMovimientosResponse = lote([["u2", { id: "visita:x", tipo: "visita", hora: "2026-09-05T16:00:00Z" }]]);
    await abrir(port, 1);
    expect(await screen.findByText("Último movimiento: sáb 5 sep")).toBeInTheDocument();
    expect(screen.queryByText(/12 oct/)).not.toBeInTheDocument();
  });

  it("más de 100 vencidas: una llamada por trozo de 100", async () => {
    const port = new FakeDesempenoPort();
    const muchas = Array.from({ length: 150 }, (_, i) =>
      makeUsuarioTablero({ uid: `v${i}`, nombre: `Cobrador ${i}`, semanaVencida: true }),
    );
    port.tableroResponse = makeTablero({ usuarios: [makeUsuarioTablero({ uid: "u1", nombre: "Juan Carlos Méndez" }), ...muchas] });
    await abrir(port, 150);
    await waitFor(() => expect(port.ultimosMovimientosCalls).toHaveLength(2));
    expect(port.ultimosMovimientosCalls.map((c) => c.uids.length)).toEqual([100, 50]);
  });

  it("la vencida va al final aunque el orden la pondría primero", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      usuarios: [
        makeUsuarioTablero({ uid: "u2", nombre: "Iván Vázquez Aldama", zonaNombre: "RUTA 01", semanaVencida: true }),
        makeUsuarioTablero({ uid: "u1", nombre: "Juan Carlos Méndez", zonaNombre: "RUTA 99" }),
      ],
    });
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    await screen.findByText("Juan Carlos Méndez");
    await userEvent.click(screen.getByRole("button", { name: "Ver 1 sin actividad reciente" }));
    const filas = screen.getAllByRole("row").map((f) => f.getAttribute("aria-label"));
    const iJuan = filas.indexOf("Abrir ficha de Juan Carlos Méndez");
    const iIvan = filas.indexOf("Abrir ficha de Iván Vázquez Aldama");
    expect(iJuan).toBeGreaterThan(-1);
    expect(iIvan).toBeGreaterThan(iJuan);
  });
});
