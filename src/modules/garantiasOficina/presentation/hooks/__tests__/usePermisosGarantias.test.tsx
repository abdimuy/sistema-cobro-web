import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePermisosGarantias } from "../usePermisosGarantias";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("../../../infrastructure/http/apiClient", () => ({
  apiClient: {
    get: mocks.get,
  },
}));

describe("usePermisosGarantias", () => {
  beforeEach(() => {
    mocks.get.mockReset();
  });

  it("consulta /me y carga los permisos efectivos", async () => {
    mocks.get.mockResolvedValue({
      data: {
        permisos: [
          "garantias:leer",
          "garantias:actualizar",
        ],
      },
    });

    const { result } = renderHook(() => usePermisosGarantias());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.permisos).toEqual([
      "garantias:leer",
      "garantias:actualizar",
    ]);
    expect(result.current.error).toBeNull();
    expect(mocks.get).toHaveBeenCalledWith(
      "/me",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("acepta una sesión sin permisos", async () => {
    mocks.get.mockResolvedValue({
      data: { permisos: [] },
    });

    const { result } = renderHook(() => usePermisosGarantias());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.permisos).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("rechaza una respuesta con permisos inválidos", async () => {
    mocks.get.mockResolvedValue({
      data: { permisos: ["garantias:leer", 123] },
    });

    const { result } = renderHook(() => usePermisosGarantias());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "La respuesta de permisos no es válida",
      );
    });

    expect(result.current.permisos).toEqual([]);
  });

  it("no concede permisos si el servidor falla", async () => {
    mocks.get.mockRejectedValue(new Error("HTTP 401"));

    const { result } = renderHook(() => usePermisosGarantias());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.permisos).toEqual([]);
    expect(result.current.error).toBe("HTTP 401");
  });

  it("cancela la solicitud al desmontar el componente", () => {
    mocks.get.mockImplementation(
      () => new Promise(() => {}),
    );

    const { unmount } = renderHook(() => usePermisosGarantias());

    const opciones = mocks.get.mock.calls[0][1] as {
      signal: AbortSignal;
    };

    expect(opciones.signal.aborted).toBe(false);

    unmount();

    expect(opciones.signal.aborted).toBe(true);
  });
});
