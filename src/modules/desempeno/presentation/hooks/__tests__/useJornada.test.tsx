import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useJornada } from "../useJornada";
import { DesempenoProvider } from "../../context/DesempenoProvider";
import { FakeDesempenoPort } from "../../../application/__tests__/fakeDesempenoPort";
import { UN_MINUTO_MS } from "../lib/useCadaMinuto";

function envolver(port: FakeDesempenoPort) {
  return ({ children }: { children: ReactNode }) => (
    <DesempenoProvider port={port} preferenciasIniciales={{ pausaMin: 30 }}>
      {children}
    </DesempenoProvider>
  );
}

describe("useJornada", () => {
  afterEach(() => vi.useRealTimers());

  it("pide la jornada del usuario y día con el umbral de la pantalla", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useJornada("uid-juan", "2026-10-13", false), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.jornada).not.toBeNull());
    expect(port.jornadaCalls[0]).toEqual({
      uid: "uid-juan",
      fecha: "2026-10-13",
      consulta: { pausaMin: 30, horario: null },
    });
  });

  it("solo hoy se actualiza cada minuto", async () => {
    // Solo se finge setInterval; waitFor sondea con setInterval, así que aquí se
    // vacían las promesas con un setTimeout real.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const vaciar = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));
    const port = new FakeDesempenoPort();
    const pasado = renderHook(() => useJornada("uid-juan", "2026-10-13", false), {
      wrapper: envolver(port),
    });
    await vaciar();
    expect(pasado.result.current.jornada).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(UN_MINUTO_MS);
    });
    await vaciar();
    expect(port.jornadaCalls).toHaveLength(1);
    pasado.unmount();

    const hoy = renderHook(() => useJornada("uid-juan", "2026-10-14", true), {
      wrapper: envolver(port),
    });
    await vaciar();
    expect(hoy.result.current.jornada).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(UN_MINUTO_MS);
    });
    await vaciar();
    expect(port.jornadaCalls).toHaveLength(3);
    expect(hoy.result.current.jornada).not.toBeNull();
  });
});
