import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("@/services/api/getVentaArchivo", () => ({ getVentaArchivo: vi.fn() }));
import { getVentaArchivo, type VentaArchivoDTO } from "@/services/api/getVentaArchivo";
import { useVentaArchivo } from "./useVentaArchivo";

const mocked = vi.mocked(getVentaArchivo);
const dto = (id: string) => ({ id }) as VentaArchivoDTO;

describe("useVentaArchivo", () => {
  afterEach(() => vi.resetAllMocks());

  it("no hace petición con id null", () => {
    const { result } = renderHook(() => useVentaArchivo(null));
    expect(mocked).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ venta: null, loading: false, error: null });
  });

  it("cambia de id y descarta la respuesta de la anterior (abort)", async () => {
    let resolverA: (v: VentaArchivoDTO) => void = () => {};
    mocked.mockImplementation((id) =>
      id === "a" ? new Promise((r) => (resolverA = r)) : Promise.resolve(dto("b")),
    );
    const { result, rerender } = renderHook(({ id }) => useVentaArchivo(id), {
      initialProps: { id: "a" as string | null },
    });
    const signalA = mocked.mock.calls[0]?.[1];
    rerender({ id: "b" });
    await waitFor(() => expect(result.current.venta?.id).toBe("b"));
    expect(signalA?.aborted).toBe(true);
    await act(async () => resolverA(dto("a")));
    expect(result.current.venta?.id).toBe("b");
  });

  it("expone error y reintentar vuelve a pedir", async () => {
    mocked.mockRejectedValueOnce(new Error("sin red")).mockResolvedValueOnce(dto("a"));
    const { result } = renderHook(() => useVentaArchivo("a"));
    await waitFor(() => expect(result.current.error).toBe("sin red"));
    expect(result.current.venta).toBeNull();
    act(() => result.current.reintentar());
    await waitFor(() => expect(result.current.venta?.id).toBe("a"));
    expect(result.current.error).toBeNull();
    expect(mocked).toHaveBeenCalledTimes(2);
  });
});
