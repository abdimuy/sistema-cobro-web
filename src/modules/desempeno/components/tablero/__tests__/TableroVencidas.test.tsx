import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableroScreen } from "../TableroScreen";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeTablero,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";

describe("semanas vencidas (D19, T19)", () => {
  beforeEach(() => localStorage.clear());

  it("no se pintan hasta pedirlas y muestran su último movimiento", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({
      usuarios: [
        makeUsuarioTablero({ uid: "u1", nombre: "Juan Carlos Méndez" }),
        makeUsuarioTablero({
          uid: "u2",
          nombre: "Iván Vázquez Aldama",
          semanaVencida: true,
          inicioSemana: "2025-11-11T14:00:00Z",
          ultimoMovimiento: { id: "visita:x", tipo: "visita", hora: "2026-09-05T16:00:00Z" },
        }),
        makeUsuarioTablero({ uid: "u3", nombre: "Ana Lilia Ortega", semanaVencida: true, ultimoMovimiento: null }),
      ],
    });
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    expect(await screen.findByText("Juan Carlos Méndez")).toBeInTheDocument();
    expect(screen.queryByText("Iván Vázquez Aldama")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver 2 sin actividad reciente" }));
    expect(screen.getByText("Iván Vázquez Aldama")).toBeInTheDocument();
    expect(screen.getByText("Último movimiento: sáb 5 sep")).toBeInTheDocument();
    expect(screen.getByText("Sin movimiento en 92 días")).toBeInTheDocument();
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
