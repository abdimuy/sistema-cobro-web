import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableroScreen } from "../TableroScreen";
import { TableroFila } from "../TableroFila";
import { FilaEsqueleto } from "../FilaEsqueleto";
import { textoAhora } from "../textoAhora";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import {
  FakeDesempenoPort,
  makeTablero,
  makeUsuarioTablero,
} from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";
import type { Tablero } from "../../../domain/entities";

describe("carga honesta del tablero (D23, T19)", () => {
  beforeEach(() => localStorage.clear());

  it("al cambiar a Semana nunca pinta las cifras de Hoy", async () => {
    const port = new FakeDesempenoPort();
    let soltarSemana: (t: Tablero) => void = () => {};
    port.tableroResponse = () =>
      makeTablero({ periodo: "hoy", usuarios: [makeUsuarioTablero({ pagos: { n: 7, importe: "700.00" } })] });
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    expect(await screen.findByText("$700")).toBeInTheDocument();
    port.tableroResponse = () =>
      new Promise<Tablero>((r) => {
        soltarSemana = r;
      });
    await userEvent.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.queryByText("$700")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("fila-esqueleto").length).toBeGreaterThan(0);
    act(() =>
      soltarSemana(
        makeTablero({ periodo: "semana", usuarios: [makeUsuarioTablero({ pagos: { n: 30, importe: "3000.00" } })] }),
      ),
    );
    expect(await screen.findByText("$3,000")).toBeInTheDocument();
    expect(screen.queryByTestId("fila-esqueleto")).not.toBeInTheDocument();
  });

  it("una respuesta que no es del periodo elegido no se pinta (Review Focus 4)", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({ periodo: "hoy" }); // llega 'hoy' estando elegido 'semana'
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, {
      port,
      preferencias: { periodo: "semana" },
    });
    expect(await screen.findAllByTestId("fila-esqueleto")).not.toHaveLength(0);
    expect(screen.queryByText("Juan Carlos Méndez")).not.toBeInTheDocument();
    expect(screen.queryByText("$8,600")).not.toBeInTheDocument();
  });

  it("si falla la carga: 'No se pudo cargar' con Reintentar", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = () => Promise.reject(new DomainError("network", "sin red"));
    renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, { port });
    expect(await screen.findByText("No se pudo cargar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByTestId("fila-esqueleto")).not.toBeInTheDocument();
  });

  describe("mensaje tras 1 s (fake timers)", () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it("'Cargando semana…' aparece a 1 s y no antes", async () => {
      const port = new FakeDesempenoPort();
      port.tableroResponse = () => new Promise<Tablero>(() => {});
      renderConDesempeno(<TableroScreen onAbrirUsuario={() => {}} puedeConfigurar />, {
        port,
        preferencias: { periodo: "semana" },
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(900);
      });
      expect(screen.queryByText("Cargando semana…")).not.toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
      expect(screen.getByText("Cargando semana…")).toBeInTheDocument();
    });
  });
});

describe("esqueleto fiel a la fila", () => {
  it("misma cantidad de celdas y mismas clases de alto que TableroFila", () => {
    const u = makeUsuarioTablero();
    const { container: a } = render(
      <table>
        <tbody>
          <TableroFila
            usuario={u}
            periodo="hoy"
            eje={{ desdeHora: 7, hastaHora: 20 }}
            pausaMin={45}
            horario={null}
            vista="bloques"
            generadoAt="2026-10-14T22:40:00Z"
            onAbrir={() => {}}
          />
        </tbody>
      </table>,
    );
    const { container: b } = render(
      <table>
        <tbody>
          <FilaEsqueleto />
        </tbody>
      </table>,
    );
    const celdasFila = [...a.querySelectorAll("td")];
    const celdasEsq = [...b.querySelectorAll("td")];
    expect(celdasEsq).toHaveLength(celdasFila.length);
    const alto = (td: Element) => td.className.split(" ").filter((c) => /^py-/.test(c));
    celdasFila.forEach((td, i) => expect(alto(celdasEsq[i])).toEqual(alto(td)));
  });
});

describe("textoAhora", () => {
  it("en Semana el no empezado dice Hoy sin actividad; en Hoy, No ha empezado", () => {
    const u = makeUsuarioTablero({ estadoAhora: "no_ha_empezado" });
    expect(textoAhora(u, "semana")).toBe("Hoy sin actividad");
    expect(textoAhora(u, "hoy")).toBe("No ha empezado");
  });
});
