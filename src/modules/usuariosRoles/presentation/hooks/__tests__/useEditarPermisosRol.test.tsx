import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useEditarPermisosRol } from "../useEditarPermisosRol";
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

describe("useEditarPermisosRol", () => {
  it("asignar success: llama al port, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useEditarPermisosRol(onSuccess), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.asignar("rol-cobrador", "usuarios:ver");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.asignarPermisoARolCalls[0]).toMatchObject({
      rolId: "rol-cobrador",
      codigo: "usuarios:ver",
    });
    expect(toast.success).toHaveBeenCalledWith("Permiso agregado");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("asignar error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.asignarPermisoARol = new DomainError(
      "permiso_no_existe",
      "el permiso ya no existe",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useEditarPermisosRol(onSuccess), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.asignar("rol-cobrador", "usuarios:fantasma");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("permiso_no_existe");
    expect(toast.error).toHaveBeenCalledWith(
      "No se pudo agregar el permiso",
      expect.objectContaining({ description: "el permiso ya no existe" }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("quitar success: llama al port, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useEditarPermisosRol(onSuccess), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.quitar("rol-cobrador", "usuarios:ver");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.quitarPermisoDeRolCalls[0]).toMatchObject({
      rolId: "rol-cobrador",
      codigo: "usuarios:ver",
    });
    expect(toast.success).toHaveBeenCalledWith("Permiso quitado");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("quitar error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.quitarPermisoDeRol = new DomainError(
      "rol_no_existe",
      "el rol ya no existe",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useEditarPermisosRol(onSuccess), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.quitar("rol-fantasma", "usuarios:ver");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("rol_no_existe");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("saving es true mientras la mutación está en curso", () => {
    const port = new FakeUsuariosRolesPort();
    port.asignarPermisoARol = () => new Promise<never>(() => {});
    const { result } = renderHook(() => useEditarPermisosRol(), { wrapper: wrapWith(port) });

    act(() => {
      void result.current.asignar("rol-cobrador", "usuarios:ver");
    });

    expect(result.current.saving).toBe(true);
  });

  it("reset vuelve el estado a idle", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.asignarPermisoARol = new DomainError("permiso_no_existe", "no existe");
    const { result } = renderHook(() => useEditarPermisosRol(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.asignar("rol-cobrador", "usuarios:ver");
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
