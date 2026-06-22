import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { RutasProvider } from "../context/RutasContext";
import { useRutas } from "./useRutas";
import {
  FakeRutasPort,
  makeFakeRuta,
} from "../../application/__tests__/fakeRutasPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRutasPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <RutasProvider port={port}>{children}</RutasProvider>
  );
}

describe("useRutas", () => {
  it("fetches on mount and exposes rutas", async () => {
    const port = new FakeRutasPort();
    port.listarResponse = [
      makeFakeRuta({ zonaId: 3, zonaNombre: "ZONA CENTRO" }),
      makeFakeRuta({ zonaId: 7, zonaNombre: "ZONA NORTE", cobradorNombre: "CARLOS RAMOS LUNA" }),
    ];
    const { result } = renderHook(() => useRutas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rutas).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeRutasPort();
    // Never resolves — we check the loading state synchronously.
    port.listarResponse = () => {
      return new Promise<never>(() => {}) as unknown as never[];
    };
    const { result } = renderHook(() => useRutas(), {
      wrapper: wrapWith(port),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRutasPort();
    port.throwOnNext.listarRutas = new DomainError(
      "network_error",
      "error de red",
    );
    const { result } = renderHook(() => useRutas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.rutas).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeRutasPort();
    port.listarResponse = [makeFakeRuta()];
    const { result } = renderHook(() => useRutas(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarCalls.length).toBeGreaterThanOrEqual(2));
    expect(result.current.rutas).toHaveLength(1);
  });
});
