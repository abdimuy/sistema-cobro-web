import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useBandejaGarantias,
  useDetalleGarantia,
} from "../useGarantias";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  obtener: vi.fn(),
}));

vi.mock("../../composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    listar: mocks.listar,
    obtener: mocks.obtener,
  }),
}));

const pagina = {
  items: [],
  next_cursor: "cursor-2",
  has_more: true,
};

const detalle = {
  garantia: {
    id: "garantia-1",
    folio: "G-001",
    articulos: [],
  },
  eventos: [],
};

describe("useBandejaGarantias", () => {
  beforeEach(() => {
    mocks.listar.mockReset();
  });

  it("solicita la primera página con límite de 20", async () => {
    mocks.listar.mockResolvedValue(pagina);

    const { result } = renderHook(() =>
      useBandejaGarantias({ estado: "abierto" }),
    );

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.pagina).toEqual(pagina);
    expect(result.current.error).toBeNull();

    expect(mocks.listar).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "abierto" }),
      { limit: 20, cursor: undefined },
      expect.any(AbortSignal),
    );
  });

  it("consulta una página utilizando el cursor recibido", async () => {
    mocks.listar.mockResolvedValue(pagina);

    renderHook(() =>
      useBandejaGarantias({}, "cursor-2"),
    );

    await waitFor(() => {
      expect(mocks.listar).toHaveBeenCalledWith(
        expect.any(Object),
        { limit: 20, cursor: "cursor-2" },
        expect.any(AbortSignal),
      );
    });
  });

  it("cancela la petición anterior al cambiar el filtro", async () => {
    mocks.listar.mockImplementation(() => new Promise(() => {}));

    const { rerender, unmount } = renderHook(
      ({ estado }) => useBandejaGarantias({ estado }),
      { initialProps: { estado: "abierto" } },
    );

    const primeraSignal = mocks.listar.mock.calls[0][2] as AbortSignal;

    rerender({ estado: "cerrado" });

    expect(primeraSignal.aborted).toBe(true);
    expect(mocks.listar).toHaveBeenCalledTimes(2);

    const segundaSignal = mocks.listar.mock.calls[1][2] as AbortSignal;
    expect(segundaSignal.aborted).toBe(false);

    unmount();
    expect(segundaSignal.aborted).toBe(true);
  });

  it("muestra el error y no conserva una página inválida", async () => {
    mocks.listar.mockRejectedValue(new Error("Error 500"));

    const { result } = renderHook(() => useBandejaGarantias({}));

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.error).toBe("Error 500");
    expect(result.current.pagina).toBeNull();
  });
});

describe("useDetalleGarantia", () => {
  beforeEach(() => {
    mocks.obtener.mockReset();
  });

  it("no consulta cuando no hay folio seleccionado", () => {
    const { result } = renderHook(() => useDetalleGarantia(null));

    expect(mocks.obtener).not.toHaveBeenCalled();
    expect(result.current.detalle).toBeNull();
    expect(result.current.cargando).toBe(false);
  });

  it("obtiene el detalle del folio seleccionado", async () => {
    mocks.obtener.mockResolvedValue(detalle);

    const { result } = renderHook(() =>
      useDetalleGarantia("garantia-1"),
    );

    await waitFor(() => {
      expect(result.current.detalle).toEqual(detalle);
    });

    expect(mocks.obtener).toHaveBeenCalledWith(
      "garantia-1",
      expect.any(AbortSignal),
    );
  });

  it("vuelve a consultar cuando cambia la revisión", async () => {
    mocks.obtener.mockResolvedValue(detalle);

    const { rerender } = renderHook(
      ({ revision }) => useDetalleGarantia("garantia-1", revision),
      { initialProps: { revision: 0 } },
    );

    await waitFor(() => {
      expect(mocks.obtener).toHaveBeenCalledTimes(1);
    });

    rerender({ revision: 1 });

    await waitFor(() => {
      expect(mocks.obtener).toHaveBeenCalledTimes(2);
    });
  });

  it("cancela el detalle anterior al seleccionar otro folio", () => {
    mocks.obtener.mockImplementation(() => new Promise(() => {}));

    const { rerender, unmount } = renderHook(
      ({ id }) => useDetalleGarantia(id),
      { initialProps: { id: "garantia-1" } },
    );

    const primeraSignal = mocks.obtener.mock.calls[0][1] as AbortSignal;

    rerender({ id: "garantia-2" });

    expect(primeraSignal.aborted).toBe(true);
    expect(mocks.obtener).toHaveBeenCalledTimes(2);

    unmount();
    expect(
      (mocks.obtener.mock.calls[1][1] as AbortSignal).aborted,
    ).toBe(true);
  });

  it("limpia el detalle cuando se deselecciona el folio", async () => {
    mocks.obtener.mockResolvedValue(detalle);

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useDetalleGarantia(id),
      { initialProps: { id: "garantia-1" as string | null } },
    );

    await waitFor(() => {
      expect(result.current.detalle).toEqual(detalle);
    });

    rerender({ id: null });

    await waitFor(() => {
      expect(result.current.detalle).toBeNull();
    });

    expect(result.current.error).toBeNull();
  });

  it("presenta un error de consulta", async () => {
    mocks.obtener.mockRejectedValue(new Error("Folio no encontrado"));

    const { result } = renderHook(() =>
      useDetalleGarantia("garantia-inexistente"),
    );

    await waitFor(() => {
      expect(result.current.cargando).toBe(false);
    });

    expect(result.current.error).toBe("Folio no encontrado");
    expect(result.current.detalle).toBeNull();
  });
});
