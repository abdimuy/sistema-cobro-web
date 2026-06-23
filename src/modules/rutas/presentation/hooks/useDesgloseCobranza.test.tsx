import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { RutasProvider } from "../context/RutasContext";
import { useDesgloseCobranza } from "./useDesgloseCobranza";
import {
  FakeRutasPort,
  makeFakeVentaCobranza,
} from "../../application/__tests__/fakeRutasPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRutasPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <RutasProvider port={port}>{children}</RutasProvider>
  );
}

describe("useDesgloseCobranza", () => {
  it("fetches desglose for a given zonaId", async () => {
    const port = new FakeRutasPort();
    port.desgloseResponse = {
      fechaInicioSemana: "2026-06-16",
      ventas: [
        makeFakeVentaCobranza({ ventaId: 1001, clienteId: 5 }),
        makeFakeVentaCobranza({ ventaId: 1002, clienteId: 8 }),
      ],
    };

    const { result } = renderHook(() => useDesgloseCobranza(3), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ventas).toHaveLength(2);
    expect(result.current.fechaInicio).toBe("2026-06-16");
    expect(result.current.error).toBeNull();
    expect(port.desgloseCalls).toHaveLength(1);
    expect(port.desgloseCalls[0].zonaId).toBe(3);
  });

  it("skips fetch when zonaId is null", () => {
    const port = new FakeRutasPort();
    const { result } = renderHook(() => useDesgloseCobranza(null), {
      wrapper: wrapWith(port),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.ventas).toHaveLength(0);
    expect(port.desgloseCalls).toHaveLength(0);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeRutasPort();
    port.desgloseResponse = () => new Promise<never>(() => {});
    const { result } = renderHook(() => useDesgloseCobranza(3), {
      wrapper: wrapWith(port),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRutasPort();
    port.throwOnNext.desgloseCobranza = new DomainError(
      "network_error",
      "error de red",
    );

    const { result } = renderHook(() => useDesgloseCobranza(3), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.ventas).toHaveLength(0);
  });
});
