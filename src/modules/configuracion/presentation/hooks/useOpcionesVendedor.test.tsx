import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useOpcionesVendedor } from "./useOpcionesVendedor";
import {
  FakeConfiguracionPort,
  makeFakeIdentidadMicrosip,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useOpcionesVendedor", () => {
  it("fetches on mount and exposes opciones", async () => {
    const port = new FakeConfiguracionPort();
    port.listarOpcionesResponse = [
      makeFakeIdentidadMicrosip({ nombre: "CARLOS RAMOS LUNA", matchCount: 3 }),
      makeFakeIdentidadMicrosip({ nombre: "MARÍA LÓPEZ SOTO", matchCount: 1, v2ListaId: null, v3ListaId: null }),
    ];
    const { result } = renderHook(() => useOpcionesVendedor(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.opciones).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarOpcionesCalls).toHaveLength(1);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarOpciones = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useOpcionesVendedor(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.opciones).toHaveLength(0);
  });
});
