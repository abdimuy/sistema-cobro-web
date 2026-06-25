import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { RutasProvider } from "../context/RutasContext";
import { useReporteUsuarios } from "./useReporteUsuarios";
import {
  FakeRutasPort,
  makeFakeReporteUsuario,
} from "../../application/__tests__/fakeRutasPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeRutasPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <RutasProvider port={port}>{children}</RutasProvider>
  );
}

describe("useReporteUsuarios", () => {
  it("fetches on mount and exposes usuarios", async () => {
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [
      makeFakeReporteUsuario({ uid: "uid-1", nombre: "JUAN PÉREZ" }),
      makeFakeReporteUsuario({ uid: "uid-2", nombre: "CARLOS RAMOS" }),
    ];
    const { result } = renderHook(() => useReporteUsuarios(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.usuarios).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.reporteUsuariosCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = () =>
      new Promise<never>(() => {}) as unknown as never[];
    const { result } = renderHook(() => useReporteUsuarios(), {
      wrapper: wrapWith(port),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeRutasPort();
    port.throwOnNext.listarReporteUsuarios = new DomainError(
      "network_error",
      "error de red",
    );
    const { result } = renderHook(() => useReporteUsuarios(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.usuarios).toHaveLength(0);
  });

  it("refresh re-fetches the report", async () => {
    const port = new FakeRutasPort();
    port.reporteUsuariosResponse = [makeFakeReporteUsuario()];
    const { result } = renderHook(() => useReporteUsuarios(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() =>
      expect(port.reporteUsuariosCalls.length).toBeGreaterThanOrEqual(2),
    );
    expect(result.current.usuarios).toHaveLength(1);
  });
});
