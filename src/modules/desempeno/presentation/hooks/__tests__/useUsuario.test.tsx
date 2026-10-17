import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useUsuario } from "../useUsuario";
import { usePreferencias } from "../../context/usePreferencias";
import { DesempenoProvider } from "../../context/DesempenoProvider";
import { FakeDesempenoPort, makeFichaUsuario } from "../../../application/__tests__/fakeDesempenoPort";

function envolver(port: FakeDesempenoPort) {
  return ({ children }: { children: ReactNode }) => (
    <DesempenoProvider port={port}>{children}</DesempenoProvider>
  );
}

describe("useUsuario", () => {
  it("pide la ficha del usuario con el periodo de la pantalla, no el tablero", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useUsuario("uid-juan"), { wrapper: envolver(port) });
    await waitFor(() => expect(result.current.ficha).not.toBeNull());
    expect(port.usuarioCalls[0]).toEqual({
      uid: "uid-juan",
      consulta: { periodo: "hoy", pausaMin: 45, horario: null },
    });
    expect(port.tableroCalls).toHaveLength(0);
  });

  it("cambiar a Semana borra la ficha de Hoy mientras llega la nueva", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => ({ u: useUsuario("uid-juan"), p: usePreferencias() }), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.u.ficha?.periodo).toBe("hoy"));
    let liberar: () => void = () => {};
    port.usuarioResponse = () =>
      new Promise((res) => {
        liberar = () => res(makeFichaUsuario({ periodo: "semana" }));
      });
    act(() => result.current.p.setPeriodo("semana"));
    expect(result.current.u.ficha).toBeNull();
    await act(async () => liberar());
    expect(result.current.u.ficha?.periodo).toBe("semana");
  });
});
