import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useTablero } from "../useTablero";
import { usePreferencias } from "../../context/usePreferencias";
import { DesempenoProvider } from "../../context/DesempenoProvider";
import { FakeDesempenoPort, makeTablero } from "../../../application/__tests__/fakeDesempenoPort";
import { DomainError } from "../../../domain/errors";
import { UN_MINUTO_MS } from "../lib/useCadaMinuto";

function envolver(port: FakeDesempenoPort) {
  return ({ children }: { children: ReactNode }) => (
    <DesempenoProvider port={port}>{children}</DesempenoProvider>
  );
}

describe("useTablero", () => {
  afterEach(() => vi.useRealTimers());

  it("pide Hoy con pausa de 45 min y sin horario al abrir", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useTablero(), { wrapper: envolver(port) });
    await waitFor(() => expect(result.current.tablero).not.toBeNull());
    expect(port.tableroCalls[0].consulta).toEqual({ periodo: "hoy", pausaMin: 45, horario: null });
  });

  it("cambiar a Semana vuelve a pedir y no muestra los datos de Hoy mientras llega", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => ({ t: useTablero(), p: usePreferencias() }), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.t.tablero?.periodo).toBe("hoy"));
    let liberar: () => void = () => {};
    port.tableroResponse = () =>
      new Promise((res) => {
        liberar = () => res(makeTablero({ periodo: "semana" }));
      });

    act(() => result.current.p.setPeriodo("semana"));

    expect(result.current.t.tablero).toBeNull();
    await act(async () => liberar());
    expect(result.current.t.tablero?.periodo).toBe("semana");
    expect(port.tableroCalls[port.tableroCalls.length - 1]?.consulta.periodo).toBe("semana");
  });

  it("se actualiza cada minuto y conserva los datos si la actualización falla", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useTablero(), { wrapper: envolver(port) });
    // waitFor sondea con setInterval, que aquí es falso: se vacían las promesas con act.
    await act(async () => {});
    expect(result.current.tablero).not.toBeNull();

    port.throwOnNext.obtenerTablero = new DomainError("network_error", "error de red");
    act(() => {
      vi.advanceTimersByTime(UN_MINUTO_MS);
    });
    vi.useRealTimers();

    await waitFor(() => expect(result.current.error?.code).toBe("network_error"));
    expect(port.tableroCalls).toHaveLength(2);
    expect(result.current.tablero).not.toBeNull();
  });

  it("una consulta que tarda más de un minuto termina mostrando datos (el minuto no la aborta)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const port = new FakeDesempenoPort();
    port.tableroResponse = () =>
      new Promise((res) => {
        setTimeout(() => res(makeTablero()), UN_MINUTO_MS + 30_000);
      });
    const { result } = renderHook(() => useTablero(), { wrapper: envolver(port) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UN_MINUTO_MS + 30_000);
    });

    expect(port.tableroCalls).toHaveLength(1);
    expect(result.current.tablero).not.toBeNull();
  });
});
