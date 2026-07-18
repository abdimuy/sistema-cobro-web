import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ConfiguracionProvider } from "../context/ConfiguracionContext";
import { useOpcionesZonasCajas } from "./useOpcionesZonasCajas";
import {
  FakeConfiguracionPort,
  makeFakeOpcionesZonasCajas,
} from "../../application/__tests__/fakeConfiguracionPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeConfiguracionPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ConfiguracionProvider port={port}>{children}</ConfiguracionProvider>
  );
}

describe("useOpcionesZonasCajas", () => {
  it("fetches on mount and exposes the 5 catalogs", async () => {
    const port = new FakeConfiguracionPort();
    port.listarOpcionesZonasCajasResponse = makeFakeOpcionesZonasCajas();
    const { result } = renderHook(() => useOpcionesZonasCajas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.opciones.cajas.length).toBeGreaterThan(0);
    expect(result.current.opciones.cobradores.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
    expect(port.listarOpcionesZonasCajasCalls).toHaveLength(1);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeConfiguracionPort();
    port.throwOnNext.listarOpcionesZonasCajas = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useOpcionesZonasCajas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.opciones.cajas).toHaveLength(0);
  });
});
