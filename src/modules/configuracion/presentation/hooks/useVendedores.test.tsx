import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useVendedores } from "./useVendedores";
import {
  FakeConfiguracionPort,
  makeFakeVendedorAsignacion,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useVendedores", () => {
  it("fetches on mount and exposes vendedores", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [
      makeFakeVendedorAsignacion({ usuarioId: "uid-1", nombre: "BRENDA SÁNCHEZ RUIZ" }),
      makeFakeVendedorAsignacion({ usuarioId: "uid-2", nombre: "CARLOS RAMOS LUNA" }),
    ];
    const { result } = renderHook(() => useVendedores(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.vendedores).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarVendedoresCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = () => {
      return new Promise<never>(() => {}) as unknown as never[];
    };
    const { result } = renderHook(() => useVendedores(), { wrapper: wrapWith(port) });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarVendedores = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useVendedores(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.vendedores).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeConfiguracionPort();
    port.listarVendedoresResponse = [makeFakeVendedorAsignacion()];
    const { result } = renderHook(() => useVendedores(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarVendedoresCalls.length).toBeGreaterThanOrEqual(2));
    expect(result.current.vendedores).toHaveLength(1);
  });
});
