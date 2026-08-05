import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { UsuariosRolesProvider } from "../../context/UsuariosRolesContext";
import { useCrudRol } from "../useCrudRol";
import {
  FakeUsuariosRolesPort,
  makeFakeRol,
} from "../../../application/__tests__/fakeUsuariosRolesPort";
import { DomainError } from "../../../domain/errors";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapWith(port: FakeUsuariosRolesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <UsuariosRolesProvider port={port}>{children}</UsuariosRolesProvider>
  );
}

describe("useCrudRol", () => {
  it("crear success: llega a done, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.crearRolResponse = makeFakeRol({ id: "rol-nuevo", nombre: "auxiliar" });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.crear({ nombre: "auxiliar" });
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(port.crearRolCalls[0].input).toEqual({ nombre: "auxiliar" });
    expect(toast.success).toHaveBeenCalledWith(
      "Rol creado",
      expect.objectContaining({ description: "auxiliar" }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("crear error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.crearRol = new DomainError(
      "rol_nombre_duplicado",
      "ya existe un rol con ese nombre",
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.crear({ nombre: "auxiliar" });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("rol_nombre_duplicado");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("renombrar success: llega a done, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.actualizarRolResponse = makeFakeRol({ id: "rol-cobrador", nombre: "cobrador senior" });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.renombrar("rol-cobrador", { nombre: "cobrador senior" });
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(port.actualizarRolCalls[0]).toMatchObject({
      rolId: "rol-cobrador",
      input: { nombre: "cobrador senior" },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Rol actualizado",
      expect.objectContaining({ description: "cobrador senior" }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("renombrar error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.actualizarRol = new DomainError("rol_inmutable", "no se puede editar");
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.renombrar("rol-super-admin", { nombre: "otro" });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("rol_inmutable");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("eliminar success: vuelve a idle, dispara toast + onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("rol-auxiliar");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(port.eliminarRolCalls[0].rolId).toBe("rol-auxiliar");
    expect(toast.success).toHaveBeenCalledWith("Rol eliminado");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("eliminar error: llega a error state y no llama onSuccess", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.eliminarRol = new DomainError("rol_inmutable", "no se puede eliminar");
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useCrudRol(onSuccess), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("rol-super-admin");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.code).toBe("rol_inmutable");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("saving es true mientras la mutación está en curso", () => {
    const port = new FakeUsuariosRolesPort();
    port.crearRolResponse = () => new Promise<never>(() => {}) as unknown as never;
    const { result } = renderHook(() => useCrudRol(), { wrapper: wrapWith(port) });

    act(() => {
      void result.current.crear({ nombre: "auxiliar" });
    });

    expect(result.current.saving).toBe(true);
  });

  it("reset vuelve el estado a idle", async () => {
    const port = new FakeUsuariosRolesPort();
    port.throwOnNext.eliminarRol = new DomainError("rol_inmutable", "no se puede eliminar");
    const { result } = renderHook(() => useCrudRol(), { wrapper: wrapWith(port) });

    await act(async () => {
      await result.current.eliminar("rol-super-admin");
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
  });
});
