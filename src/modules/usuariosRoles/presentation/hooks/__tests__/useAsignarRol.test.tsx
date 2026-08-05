import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useAsignarRol } from "../useAsignarRol";
import { FakeUsuariosRolesPort } from "../../../application/__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../../domain/errors";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapWith(port: FakeUsuariosRolesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
  );
}

describe("useAsignarRol", () => {
  it("asignar success: vuelve a idle, llama al port y dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("usr-1", "rol-cobrador");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.asignarRolAUsuarioCalls[0]).toMatchObject({
      usuarioId: "usr-1",
      rolId: "rol-cobrador",
    });
    expect(toast.success).toHaveBeenCalledWith("Rol asignado");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("asignar error: llega a error state, dispara toast.error y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.asignarRolAUsuario = new DomainError(
      "rol_no_existe",
      "el rol ya no existe",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("usr-1", "rol-fantasma");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("rol_no_existe");
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudo asignar el rol",
      expect.objectContaining({ description: "el rol ya no existe" }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("quitar success: llama al port, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.quitar("usr-1", "rol-cobrador");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.quitarRolAUsuarioCalls[0]).toMatchObject({
      usuarioId: "usr-1",
      rolId: "rol-cobrador",
    });
    expect(toast.success).toHaveBeenCalledWith("Rol removido");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("quitar error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.quitarRolAUsuario = new DomainError(
      "usuario_no_existe",
      "el usuario ya no existe",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsignarRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.quitar("usr-fantasma", "rol-cobrador");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("usuario_no_existe");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("saving es true mientras la mutación está en curso", () => {
    const port = new FakeUsuariosRolesPort();
    port.asignarRolAUsuario = () => new Promise<never>(() => {});
    const { result } = renderHook(() => useAsignarRol(), { wrapper: wrapWith(port) });

    act(() => {
      void result.current.asignar("usr-1", "rol-cobrador");
    });

    expect(result.current.saving).toBe(true);
  });

  it("reset vuelve el estado a idle", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.asignarRolAUsuario = new DomainError("rol_no_existe", "no existe");
    const { result } = renderHook(() => useAsignarRol(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("usr-1", "rol-cobrador");
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
