import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock the use case the hook delegates to — no real HTTP adapter/axios
// involved, matching the FakeClientesPort-style approach used elsewhere in
// the clientes module's own hook tests.
vi.mock("@/modules/clientes/application/usecases/buscarClientes", () => ({
  buscarClientes: vi.fn(),
}));

import { buscarClientes } from "@/modules/clientes/application/usecases/buscarClientes";
import { DomainError } from "@/modules/clientes/domain/errors";
import { makeFakeCliente } from "@/modules/clientes/application/__tests__/fakeClientesPort";
import type { BuscarClientesOutput } from "@/modules/clientes/application/dto";
import { useBuscarClientesMicrosip } from "./useBuscarClientesMicrosip";

const mockBuscarClientes = vi.mocked(buscarClientes);

beforeEach(() => {
  mockBuscarClientes.mockReset();
});

describe("useBuscarClientesMicrosip", () => {
  it("does not fetch when q is empty", async () => {
    const { result } = renderHook(() => useBuscarClientesMicrosip(""));

    await new Promise((r) => setTimeout(r, 350));

    expect(mockBuscarClientes).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when q is only whitespace", async () => {
    const { result } = renderHook(() => useBuscarClientesMicrosip("   "));

    await new Promise((r) => setTimeout(r, 350));

    expect(mockBuscarClientes).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it("debounces and fetches ~300ms after q settles", async () => {
    const cliente = makeFakeCliente({ clienteId: 24037, nombre: "MINERVA LÓPEZ HERNÁNDEZ" });
    mockBuscarClientes.mockResolvedValue({ items: [cliente], nextCursor: "", facets: {} });

    const { result } = renderHook(() => useBuscarClientesMicrosip("minerva"));

    // Immediately after mount we're still inside the debounce window.
    expect(mockBuscarClientes).not.toHaveBeenCalled();

    await waitFor(() => expect(mockBuscarClientes).toHaveBeenCalledTimes(1));
    expect(mockBuscarClientes.mock.calls[0][1]).toMatchObject({ q: "minerva", limit: 8 });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].nombre).toBe("MINERVA LÓPEZ HERNÁNDEZ");
    expect(result.current.isLoading).toBe(false);
  });

  it("a fresh query cancels/ignores a still-pending stale request", async () => {
    let resolveStale: ((v: BuscarClientesOutput) => void) | undefined;
    mockBuscarClientes.mockImplementationOnce(
      (_port, _input, signal) =>
        new Promise((resolve, reject) => {
          resolveStale = resolve;
          signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    const { result, rerender } = renderHook(
      ({ q }) => useBuscarClientesMicrosip(q),
      { initialProps: { q: "abc" } },
    );

    await waitFor(() => expect(mockBuscarClientes).toHaveBeenCalledTimes(1));

    const freshCliente = makeFakeCliente({ clienteId: 900, nombre: "CLIENTE FRESCO" });
    mockBuscarClientes.mockResolvedValueOnce({ items: [freshCliente], nextCursor: "", facets: {} });

    rerender({ q: "abcd" });
    await waitFor(() => expect(mockBuscarClientes).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.items[0]?.nombre).toBe("CLIENTE FRESCO"));

    // The stale request finally settles — it must not clobber the fresh result.
    resolveStale?.({
      items: [makeFakeCliente({ clienteId: 1, nombre: "CLIENTE VIEJO" })],
      nextCursor: "",
      facets: {},
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current.items[0]?.nombre).toBe("CLIENTE FRESCO");
    expect(result.current.error).toBeNull();
  });

  it("clearing q back to empty resets items without a new fetch", async () => {
    mockBuscarClientes.mockResolvedValue({
      items: [makeFakeCliente()],
      nextCursor: "",
      facets: {},
    });

    const { result, rerender } = renderHook(
      ({ q }) => useBuscarClientesMicrosip(q),
      { initialProps: { q: "hernandez" } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    rerender({ q: "" });

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(mockBuscarClientes).toHaveBeenCalledTimes(1);
  });

  it("an abort error from the port is swallowed, not surfaced as a UI error", async () => {
    mockBuscarClientes.mockImplementationOnce((_port, _input, signal) => {
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const { result, rerender } = renderHook(
      ({ q }) => useBuscarClientesMicrosip(q),
      { initialProps: { q: "abc" } },
    );
    await waitFor(() => expect(mockBuscarClientes).toHaveBeenCalledTimes(1));

    mockBuscarClientes.mockResolvedValueOnce({ items: [], nextCursor: "", facets: {} });
    rerender({ q: "" }); // triggers the cleanup abort, no new request follows

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.error).toBeNull();
  });

  it("surfaces a genuine (non-abort) failure as a DomainError", async () => {
    mockBuscarClientes.mockRejectedValue(new DomainError("network_error", "fallo de red"));

    const { result } = renderHook(() => useBuscarClientesMicrosip("maria"));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
