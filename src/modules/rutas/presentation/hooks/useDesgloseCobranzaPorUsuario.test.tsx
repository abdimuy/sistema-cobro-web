import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { RutasProvider } from "../context/RutasContext";
import { useDesgloseCobranzaPorUsuario } from "./useDesgloseCobranzaPorUsuario";
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

describe("useDesgloseCobranzaPorUsuario", () => {
  it("fetches desglose for a given uid", async () => {
    const port = new FakeRutasPort();
    port.desglosePorUsuarioResponse = {
      fechaInicioSemana: "2026-06-16T00:00:00Z",
      ventas: [
        makeFakeVentaCobranza({ ventaId: 1001, clienteId: 5 }),
        makeFakeVentaCobranza({ ventaId: 1002, clienteId: 8 }),
      ],
      resumen: { numerador: "1.70", denominador: 2, pctPonderado: "85.0" },
    };

    const { result } = renderHook(
      () => useDesgloseCobranzaPorUsuario("uid-juan"),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ventas).toHaveLength(2);
    expect(result.current.fechaInicio).toBe("2026-06-16T00:00:00Z");
    expect(result.current.error).toBeNull();
    expect(port.desglosePorUsuarioCalls).toHaveLength(1);
    expect(port.desglosePorUsuarioCalls[0].uid).toBe("uid-juan");
  });

  it("skips fetch when uid is null", () => {
    const port = new FakeRutasPort();
    const { result } = renderHook(
      () => useDesgloseCobranzaPorUsuario(null),
      { wrapper: wrapWith(port) },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.ventas).toHaveLength(0);
    expect(port.desglosePorUsuarioCalls).toHaveLength(0);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeRutasPort();
    port.desglosePorUsuarioResponse = () => new Promise<never>(() => {});
    const { result } = renderHook(
      () => useDesgloseCobranzaPorUsuario("uid-juan"),
      { wrapper: wrapWith(port) },
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRutasPort();
    port.throwOnNext.desgloseCobranzaPorUsuario = new DomainError(
      "network_error",
      "error de red",
    );

    const { result } = renderHook(
      () => useDesgloseCobranzaPorUsuario("uid-juan"),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.ventas).toHaveLength(0);
  });
});
