import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useAsignarZonaCaja } from "./useAsignarZonaCaja";
import {
  FakeConfiguracionPort,
  makeFakeZonaCajaAsignacion,
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

describe("useAsignarZonaCaja", () => {
  it("asignar success: llega a done y dispara refresh", async () => {
    const port = new FakeConfiguracionPort();
    port.asignarZonaCajaResponse = makeFakeZonaCajaAsignacion({ zonaClienteId: 12 });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarZonaCaja(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar({
        zonaClienteId: 12,
        cajaId: 501,
        cajeroId: 601,
        vendedorId: 701,
        cobradorId: 801,
      });
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(port.asignarZonaCajaCalls[0].input).toEqual({
      zonaClienteId: 12,
      cajaId: 501,
      cajeroId: 601,
      vendedorId: 701,
      cobradorId: 801,
    });
  });

  it("asignar con sentinel -1 (sin asignar) en algunos slots", async () => {
    const port = new FakeConfiguracionPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarZonaCaja(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar({
        zonaClienteId: 12,
        cajaId: -1,
        cajeroId: -1,
        vendedorId: 701,
        cobradorId: -1,
      });
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(port.asignarZonaCajaCalls[0].input).toEqual({
      zonaClienteId: 12,
      cajaId: -1,
      cajeroId: -1,
      vendedorId: 701,
      cobradorId: -1,
    });
  });

  it("asignar error: llega a error state y no dispara refresh", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.asignarZonaCaja = new DomainError(
      "caja_no_existe",
      "la caja seleccionada no existe en Microsip",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarZonaCaja(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar({
        zonaClienteId: 12,
        cajaId: 999,
        cajeroId: -1,
        vendedorId: -1,
        cobradorId: -1,
      });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("caja_no_existe");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("saving es true mientras la mutación está en curso", () => {
    const port = new FakeConfiguracionPort();
    port.asignarZonaCajaResponse = () => new Promise<never>(() => {}) as unknown as never;
    const { result } = renderHook(() => useAsignarZonaCaja(), { wrapper: wrapWith(port) });

    act(() => {
      void result.current.asignar({
        zonaClienteId: 12,
        cajaId: 1,
        cajeroId: 1,
        vendedorId: 1,
        cobradorId: 1,
      });
    });

    expect(result.current.saving).toBe(true);
  });

  it("reset vuelve el estado a idle", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.asignarZonaCaja = new DomainError("caja_no_existe", "no existe");
    const { result } = renderHook(() => useAsignarZonaCaja(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar({
        zonaClienteId: 12,
        cajaId: 999,
        cajeroId: -1,
        vendedorId: -1,
        cobradorId: -1,
      });
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
