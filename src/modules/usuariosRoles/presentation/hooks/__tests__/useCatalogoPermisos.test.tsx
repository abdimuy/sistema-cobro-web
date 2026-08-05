import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useCatalogoPermisos } from "../useCatalogoPermisos";
import {
  FakeUsuariosRolesPort,
  makeFakePermiso,
} from "../../../application/__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../../domain/errors";

function wrapWith(port: FakeUsuariosRolesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
  );
}

describe("useCatalogoPermisos", () => {
  it("fetches on mount and exposes permisos", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarCatalogoPermisosResponse = [
      makeFakePermiso({ codigo: "usuarios:ver" }),
      makeFakePermiso({ codigo: "usuarios:editar" }),
    ];
    const { result } = renderHook(() => useCatalogoPermisos(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.permisos).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarCatalogoPermisosCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeUsuariosRolesPort();
    port.listarCatalogoPermisosResponse = () => new Promise<never>(() => {}) as unknown as never[];
    const { result } = renderHook(() => useCatalogoPermisos(), { wrapper: wrapWith(port) });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.listarCatalogoPermisos = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useCatalogoPermisos(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.permisos).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarCatalogoPermisosResponse = [makeFakePermiso()];
    const { result } = renderHook(() => useCatalogoPermisos(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() =>
      expect(port.listarCatalogoPermisosCalls.length).toBeGreaterThanOrEqual(2),
    );
    expect(result.current.permisos).toHaveLength(1);
  });

  it("abort on unmount no dispara setState ni act warnings", async () => {
    const port = new FakeUsuariosRolesPort();
    let resolveFn: (v: ReturnType<typeof makeFakePermiso>[]) => void = () => {};
    port.listarCatalogoPermisos = () =>
      new Promise((resolve) => {
        resolveFn = resolve;
      });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useCatalogoPermisos(), { wrapper: wrapWith(port) });
    unmount();
    resolveFn([makeFakePermiso()]);
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
