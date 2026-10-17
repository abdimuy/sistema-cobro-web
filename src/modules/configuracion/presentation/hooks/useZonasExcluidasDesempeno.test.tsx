import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useZonasExcluidasDesempeno } from "./useZonasExcluidasDesempeno";
import {
  FakeConfiguracionPort,
  makeFakeZonaExcluidaDesempeno,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useZonasExcluidasDesempeno", () => {
  it("carga la lista al montar", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasExcluidasDesempenoResponse = [makeFakeZonaExcluidaDesempeno()];
    const { result } = renderHook(() => useZonasExcluidasDesempeno(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.zonas).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("excluir refresca la lista sólo DESPUÉS de la respuesta del servidor", async () => {
    const port = new FakeConfiguracionPort();
    let lista = [makeFakeZonaExcluidaDesempeno()];
    port.listarZonasExcluidasDesempenoResponse = () => lista;
    let soltar!: () => void;
    port.excluirZonaDesempenoResponse = () =>
      new Promise((res) => {
        soltar = () => {
          lista = [...lista, makeFakeZonaExcluidaDesempeno({ zonaId: 5, zonaNombre: "CENTRO" })];
          res(makeFakeZonaExcluidaDesempeno({ zonaId: 5, zonaNombre: "CENTRO" }));
        };
      });
    const { result } = renderHook(() => useZonasExcluidasDesempeno(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let p!: Promise<boolean>;
    act(() => {
      p = result.current.excluir(5);
    });
    // Servidor aún no responde: ni segunda lectura ni lista nueva.
    expect(port.listarZonasExcluidasDesempenoCalls).toHaveLength(1);
    expect(result.current.zonas).toHaveLength(1);
    expect(result.current.guardando).toBe(true);

    await act(async () => {
      soltar();
      await p;
    });
    await waitFor(() => expect(result.current.zonas).toHaveLength(2));
    expect(port.listarZonasExcluidasDesempenoCalls).toHaveLength(2);
    expect(port.excluirZonaDesempenoCalls[0].zonaId).toBe(5);
  });

  it("si excluir falla no refresca y expone el mensaje del servidor", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasExcluidasDesempenoResponse = [];
    port.throwOnNext.excluirZonaDesempeno = new DomainError(
      "zona_no_existe",
      "la zona seleccionada ya no existe",
    );
    const { result } = renderHook(() => useZonasExcluidasDesempeno(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.excluir(99999);
    });

    expect(ok).toBe(false);
    expect(result.current.errorAccion?.message).toBe("la zona seleccionada ya no existe");
    expect(port.listarZonasExcluidasDesempenoCalls).toHaveLength(1);
  });

  it("quitar llama al puerto y refresca tras la respuesta", async () => {
    const port = new FakeConfiguracionPort();
    let lista = [makeFakeZonaExcluidaDesempeno()];
    port.listarZonasExcluidasDesempenoResponse = () => lista;
    port.quitarZonaExcluidaDesempenoResponse = () => {
      lista = [];
    };
    const { result } = renderHook(() => useZonasExcluidasDesempeno(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.zonas).toHaveLength(1));

    await act(async () => {
      await result.current.quitar(23301);
    });

    await waitFor(() => expect(result.current.zonas).toHaveLength(0));
    expect(port.quitarZonaExcluidaDesempenoCalls[0].zonaId).toBe(23301);
  });
});
