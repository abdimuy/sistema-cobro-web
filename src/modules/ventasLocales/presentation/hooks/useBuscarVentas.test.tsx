import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { VentasListProvider } from "../context/VentasListContext";
import { useBuscarVentas } from "./useBuscarVentas";
import {
  FakeVentasListPort,
  makeFakeVentaLocal,
} from "../../application/__tests__/fakeVentasListPort";
import type { VentasParams } from "../../../../services/api/getVentasLocales";

function wrapWith(port: FakeVentasListPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <VentasListProvider port={port}>{children}</VentasListProvider>
  );
}

describe("useBuscarVentas", () => {
  it("fetches the first page on mount and exposes items", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = {
      items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "v1" }), makeFakeVentaLocal({ LOCAL_SALE_ID: "v2" })],
      nextCursor: "",
    };
    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ventas).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.buscarCalls).toHaveLength(1);
  });

  it("hasMore is false when nextCursor is empty", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("hasMore is true when nextCursor is non-empty", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [makeFakeVentaLocal()], nextCursor: "cursor_abc" };
    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it("loadMore appends items and advances the cursor", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = {
      items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "v1" })],
      nextCursor: "cursor_page2",
    };

    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ventas).toHaveLength(1);

    port.buscarResponse = {
      items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "v2" })],
      nextCursor: "",
    };

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.ventas).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(port.buscarCalls).toHaveLength(2);
    expect(port.buscarCalls[1].input.cursor).toBe("cursor_page2");
  });

  it("changing a filter resets the list and re-fetches page 1", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = {
      items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "v1" })],
      nextCursor: "",
    };

    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.buscarCalls).toHaveLength(1);

    port.buscarResponse = {
      items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "v99" })],
      nextCursor: "",
    };

    act(() => result.current.setParams({ zonaClienteId: 7 }));
    await waitFor(() => expect(port.buscarCalls).toHaveLength(2));
    expect(port.buscarCalls[1].input.zonaClienteId).toBe(7);
    await waitFor(() => expect(result.current.ventas).toHaveLength(1));
    expect(result.current.ventas[0].LOCAL_SALE_ID).toBe("v99");
  });

  it("maps every supported filter through to the use case, mapping sortBy to snake_case and dropping unsupported fields", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const initialParams: Partial<VentasParams> = {
      search: "hernandez",
      tipoVenta: "CREDITO",
      situacion: "aprobada",
      sincronizacion: "aplicada",
      zonaClienteId: 12,
      precioMin: 1000,
      precioMax: 20000,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      incluirCanceladas: true,
      almacenId: 11058, // unsupported — must not reach the use case
      vendedorEmails: "maria.ramirez@muebleriamsp.mx", // se mapea a vendedorEmail (singular) del contrato
      sortBy: "nombreCliente",
      sortOrder: "asc",
      limit: 25,
    };

    const { result } = renderHook(() => useBuscarVentas(initialParams), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const sent = port.buscarCalls[0].input;
    expect(sent).toMatchObject({
      search: "hernandez",
      tipoVenta: "CREDITO",
      situacion: "aprobada",
      sincronizacion: "aplicada",
      zonaClienteId: 12,
      precioMin: 1000,
      precioMax: 20000,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      incluirCanceladas: true,
      sortBy: "nombre_cliente",
      sortOrder: "asc",
      limit: 25,
      vendedorEmail: "maria.ramirez@muebleriamsp.mx",
    });
    expect(sent).not.toHaveProperty("almacenId");
    expect(sent).not.toHaveProperty("vendedorEmails");
  });

  // El filtro de vendedor no filtraba nada, y el síntoma exacto era que NO salía
  // ninguna petición: `vendedorEmails` no estaba en el arreglo de dependencias
  // del efecto, así que elegir vendedor actualizaba el estado sin refetch.
  it("dispara una nueva búsqueda al elegir vendedor, y le pasa el email al caso de uso", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };

    const { result } = renderHook(() => useBuscarVentas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.buscarCalls).toHaveLength(1);
    expect(port.buscarCalls[0].input).not.toHaveProperty("vendedorEmail");

    act(() => result.current.setParams({ vendedorEmails: "maria.ramirez@muebleriamsp.mx" }));

    await waitFor(() => expect(port.buscarCalls).toHaveLength(2));
    expect(port.buscarCalls[1].input.vendedorEmail).toBe("maria.ramirez@muebleriamsp.mx");
  });

  it("vuelve a buscar sin el filtro al regresar a \"Todos los vendedores\"", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };

    const { result } = renderHook(
      () => useBuscarVentas({ vendedorEmails: "maria.ramirez@muebleriamsp.mx" }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.buscarCalls[0].input.vendedorEmail).toBe("maria.ramirez@muebleriamsp.mx");

    act(() => result.current.setParams({ vendedorEmails: undefined }));

    await waitFor(() => expect(port.buscarCalls).toHaveLength(2));
    expect(port.buscarCalls[1].input).not.toHaveProperty("vendedorEmail");
  });

  it("drops sortBy when the legacy value has no backend equivalent (ciudad, tipoVenta)", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useBuscarVentas({ sortBy: "ciudad" }), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(port.buscarCalls[0].input).not.toHaveProperty("sortBy");
  });

  it("surfaces port errors as a string message", async () => {
    const port = new FakeVentasListPort();
    port.throwOnNext = Object.assign(new Error("fallo de red"), { code: "network_error" });
    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.error).toBe("string");
    expect(result.current.error).toContain("fallo de red");
    expect(result.current.ventas).toHaveLength(0);
  });

  it("refetch re-fetches with the current params", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useBuscarVentas({ zonaClienteId: 3 }), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(port.buscarCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.buscarCalls[1].input.zonaClienteId).toBe(3);
  });

  it("updateSort toggles order when sorting by the same column again", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useBuscarVentas(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateSort("precioTotal"));
    await waitFor(() => expect(result.current.params.sortBy).toBe("precioTotal"));
    expect(result.current.params.sortOrder).toBe("desc");

    act(() => result.current.updateSort("precioTotal"));
    await waitFor(() => expect(result.current.params.sortOrder).toBe("asc"));
  });

  it("aborts the in-flight request when the filters change before it resolves", async () => {
    const port = new FakeVentasListPort();
    let resolveFirst: (() => void) | undefined;
    let callIndex = 0;
    port.buscarVentas = async (input, signal) => {
      callIndex += 1;
      const isFirst = callIndex === 1;
      port.buscarCalls.push({ input, signal });
      if (isFirst) {
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
        return { items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "stale" })], nextCursor: "" };
      }
      return { items: [makeFakeVentaLocal({ LOCAL_SALE_ID: "fresh" })], nextCursor: "" };
    };

    const { result } = renderHook(() => useBuscarVentas({ zonaClienteId: 1 }), {
      wrapper: wrapWith(port),
    });

    // Change filters before the first (mount) request resolves — this must
    // abort the stale request's signal and let the second call win.
    act(() => result.current.setParams({ zonaClienteId: 2 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ventas[0]?.LOCAL_SALE_ID).toBe("fresh");
    expect(port.buscarCalls[0].signal?.aborted).toBe(true);

    // Resolve the stale first request afterwards — it must not clobber state.
    resolveFirst?.();
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.ventas[0]?.LOCAL_SALE_ID).toBe("fresh");
  });
});
