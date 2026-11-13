import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCatalogosGarantias } from "../useCatalogosGarantias";

const mocks = vi.hoisted(() => ({
  obtenerCatalogos: vi.fn(),
}));

vi.mock("../../composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    obtenerCatalogos: mocks.obtenerCatalogos,
  }),
}));

const catalogos = {
  etapas: ["registrado", "diagnostico"],
  ubicaciones: ["taller", "proveedor"],
  estados: ["abierto", "cerrado"],
  tipos_evento: ["diagnostico"],
  transiciones: [],
};

describe("useCatalogosGarantias", () => {
  beforeEach(() => {
    mocks.obtenerCatalogos.mockReset();
  });

  it("carga los catálogos del servidor", async () => {
    mocks.obtenerCatalogos.mockResolvedValue(catalogos);

    const { result } = renderHook(() => useCatalogosGarantias());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.catalogos).toEqual(catalogos);
    expect(result.current.error).toBeNull();
    expect(mocks.obtenerCatalogos).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    );
  });

  it("muestra un error si fallan los catálogos", async () => {
    mocks.obtenerCatalogos.mockRejectedValue(
      new Error("Servicio no disponible"),
    );

    const { result } = renderHook(() => useCatalogosGarantias());

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.error).toBe("Servicio no disponible");
    expect(result.current.catalogos).toBeNull();
  });

  it("cancela la consulta al desmontarse", () => {
    mocks.obtenerCatalogos.mockImplementation(
      () => new Promise(() => {}),
    );

    const { unmount } = renderHook(() => useCatalogosGarantias());

    const signal = mocks.obtenerCatalogos.mock.calls[0][0] as AbortSignal;

    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
