import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useAsignarVendedor } from "./useAsignarVendedor";
import {
  FakeConfiguracionPort,
  makeFakeVendedorAsignacion,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useAsignarVendedor", () => {
  it("asignar success: llega a done y dispara refresh", async () => {
    const port = new FakeConfiguracionPort();
    port.asignarVendedorResponse = makeFakeVendedorAsignacion({
      usuarioId: "uid-1",
      estado: "3/3",
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarVendedor(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("uid-1", { l1: 101, l2: 102, l3: 103 });
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(port.asignarVendedorCalls[0].input).toEqual({
      usuarioId: "uid-1",
      listaId1: 101,
      listaId2: 102,
      listaId3: 103,
    });
  });

  it("asignar error: llega a error state y no dispara refresh", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.asignarVendedor = new DomainError(
      "vendedor_lista_id_no_pertenece",
      "el identificador de vendedor seleccionado no existe en Microsip",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarVendedor(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("uid-1", { l1: 999 });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("vendedor_lista_id_no_pertenece");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("eliminar success: vuelve a idle y dispara refresh", async () => {
    const port = new FakeConfiguracionPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarVendedor(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("uid-1");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.eliminarVendedorCalls[0].usuarioId).toBe("uid-1");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("eliminar error: llega a error state", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.eliminarVendedor = new DomainError("usuario_no_existe", "el usuario ya no existe");
    const { result } = renderHook(() => useAsignarVendedor(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("uid-fantasma");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("usuario_no_existe");
  });

  it("saving es true mientras la mutación está en curso", () => {
    const port = new FakeConfiguracionPort();
    port.asignarVendedorResponse = () => new Promise<never>(() => {}) as unknown as never;
    const { result } = renderHook(() => useAsignarVendedor(), { wrapper: wrapWith(port) });

    act(() => {
      void result.current.asignar("uid-1", { l1: 1 });
    });

    expect(result.current.saving).toBe(true);
  });

  it("reset vuelve el estado a idle", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.eliminarVendedor = new DomainError("usuario_no_existe", "no existe");
    const { result } = renderHook(() => useAsignarVendedor(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("uid-1");
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
