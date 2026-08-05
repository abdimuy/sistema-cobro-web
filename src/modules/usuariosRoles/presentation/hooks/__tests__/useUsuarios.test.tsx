import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useUsuarios } from "../useUsuarios";
import {
  FakeUsuariosRolesPort,
  makeFakeUsuario,
} from "../../../application/__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../../domain/errors";

function wrapWith(port: FakeUsuariosRolesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
  );
}

describe("useUsuarios", () => {
  it("fetches on mount and exposes usuarios", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarUsuariosResponse = [
      makeFakeUsuario({ id: "usr-1", nombre: "BRENDA SÁNCHEZ RUIZ" }),
      makeFakeUsuario({ id: "usr-2", nombre: "CARLOS RAMOS LUNA" }),
    ];
    const { result } = renderHook(() => useUsuarios(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.usuarios).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarUsuariosCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeUsuariosRolesPort();
    port.listarUsuariosResponse = () => new Promise<never>(() => {}) as unknown as never[];
    const { result } = renderHook(() => useUsuarios(), { wrapper: wrapWith(port) });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.listarUsuarios = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useUsuarios(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.usuarios).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarUsuariosResponse = [makeFakeUsuario()];
    const { result } = renderHook(() => useUsuarios(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarUsuariosCalls.length).toBeGreaterThanOrEqual(2));
    expect(result.current.usuarios).toHaveLength(1);
  });

  it("abort on unmount no dispara setState ni act warnings", async () => {
    const port = new FakeUsuariosRolesPort();
    let resolveFn: (v: ReturnType<typeof makeFakeUsuario>[]) => void = () => {};
    port.listarUsuarios = () =>
      new Promise((resolve) => {
        resolveFn = resolve;
      });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useUsuarios(), { wrapper: wrapWith(port) });
    unmount();
    resolveFn([makeFakeUsuario()]);
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
