import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useRoles } from "../useRoles";
import {
  FakeUsuariosRolesPort,
  makeFakeRol,
} from "../../../application/__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../../domain/errors";

function wrapWith(port: FakeUsuariosRolesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
  );
}

describe("useRoles", () => {
  it("fetches on mount and exposes roles", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = [
      makeFakeRol({ id: "rol-cobrador", nombre: "cobrador" }),
      makeFakeRol({ id: "rol-supervisor", nombre: "supervisor" }),
    ];
    const { result } = renderHook(() => useRoles(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.listarRolesCalls).toHaveLength(1);
  });

  it("expone isLoading true mientras carga", () => {
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = () => new Promise<never>(() => {}) as unknown as never[];
    const { result } = renderHook(() => useRoles(), { wrapper: wrapWith(port) });
    expect(result.current.isLoading).toBe(true);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.listarRoles = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useRoles(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.roles).toHaveLength(0);
  });

  it("refresh re-fetches the list", async () => {
    const port = new FakeUsuariosRolesPort();
    port.listarRolesResponse = [makeFakeRol()];
    const { result } = renderHook(() => useRoles(), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarRolesCalls.length).toBeGreaterThanOrEqual(2));
    expect(result.current.roles).toHaveLength(1);
  });

  it("abort on unmount no dispara setState ni act warnings", async () => {
    const port = new FakeUsuariosRolesPort();
    let resolveFn: (v: ReturnType<typeof makeFakeRol>[]) => void = () => {};
    port.listarRoles = () =>
      new Promise((resolve) => {
        resolveFn = resolve;
      });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useRoles(), { wrapper: wrapWith(port) });
    unmount();
    resolveFn([makeFakeRol()]);
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
