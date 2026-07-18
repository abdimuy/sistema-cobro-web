import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useZonasCajas } from "./useZonasCajas";
import {
  FakeConfiguracionPort,
  makeFakeZonaCajaAsignacion,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useZonasCajas", () => {
  it("fetches on mount and exposes zonasCajas", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [
      makeFakeZonaCajaAsignacion({ zonaClienteId: 12, zonaNombre: "ZONA CENTRO — MORELIA" }),
      makeFakeZonaCajaAsignacion({ zonaClienteId: 13, zonaNombre: "ZONA NORTE — URUAPAN" }),
    ];
    const { result } = renderHook(() => useZonasCajas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.zonasCajas).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarZonasCajasCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = () => {
      return new Promise<never>(() => {}) as unknown as never[];
    };
    const { result } = renderHook(() => useZonasCajas(), { wrapper: wrapWith(port) });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarZonasCajas = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useZonasCajas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.zonasCajas).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeConfiguracionPort();
    port.listarZonasCajasResponse = [makeFakeZonaCajaAsignacion()];
    const { result } = renderHook(() => useZonasCajas(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarZonasCajasCalls.length).toBeGreaterThanOrEqual(2));
    expect(result.current.zonasCajas).toHaveLength(1);
  });
});
