import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useBuscarClientes } from "./useBuscarClientes";
import {
  FakeClientesPort,
  makeFakeCliente,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useBuscarClientes", () => {
  it("fetches first page on mount and exposes items", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = {
      items: [makeFakeCliente({ clienteId: 1 }), makeFakeCliente({ clienteId: 2 })],
      nextCursor: "",
    };
    const { result } = renderHook(() => useBuscarClientes(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(port.buscarCalls).toHaveLength(1);
  });

  it("hasMore is false when nextCursor is empty", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useBuscarClientes(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("hasMore is true when nextCursor is non-empty", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = {
      items: [makeFakeCliente()],
      nextCursor: "cursor_abc",
    };
    const { result } = renderHook(() => useBuscarClientes(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it("loadMore appends items and updates cursor", async () => {
    const port = new FakeClientesPort();
    // First page
    port.buscarResponse = {
      items: [makeFakeCliente({ clienteId: 1 })],
      nextCursor: "cursor_page2",
    };

    const { result } = renderHook(() => useBuscarClientes(), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    // Second page
    port.buscarResponse = {
      items: [makeFakeCliente({ clienteId: 2 })],
      nextCursor: "",
    };

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(port.buscarCalls).toHaveLength(2);
    expect(port.buscarCalls[1].input.cursor).toBe("cursor_page2");
  });

  it("filter change resets items and re-fetches first page", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = {
      items: [makeFakeCliente({ clienteId: 1 })],
      nextCursor: "",
    };

    const { rerender, result } = renderHook(
      (props: { zona?: number }) => useBuscarClientes({ zona: props.zona }),
      { wrapper: wrapWith(port), initialProps: { zona: 1 } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.buscarCalls).toHaveLength(1);

    port.buscarResponse = {
      items: [makeFakeCliente({ clienteId: 99 })],
      nextCursor: "",
    };

    rerender({ zona: 2 });
    await waitFor(() => expect(port.buscarCalls).toHaveLength(2));
    expect(port.buscarCalls[1].input.zona).toBe(2);
    // Items reset (only the new page)
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].clienteId).toBe(99);
  });

  it("passes all filter primitives through to the use case", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(
      () =>
        useBuscarClientes({
          q: "Hernández",
          zona: 3,
          cobrador: 7,
          conSaldo: true,
          segmento: "DORMIDO_VALIOSO",
          estadoPago: "AL_CORRIENTE",
          scoreMin: 50,
          limit: 25,
        }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.buscarCalls[0].input).toMatchObject({
      q: "Hernández",
      zona: 3,
      cobrador: 7,
      conSaldo: true,
      segmento: "DORMIDO_VALIOSO",
      estadoPago: "AL_CORRIENTE",
      scoreMin: 50,
      limit: 25,
    });
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.buscarClientes = Object.assign(new Error("network failure"), {
      code: "network_error",
    });
    const { result } = renderHook(() => useBuscarClientes(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.items).toHaveLength(0);
  });

  it("refresh re-fetches with the same filters", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(
      () => useBuscarClientes({ zona: 3 }),
      { wrapper: wrapWith(port) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.buscarCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.buscarCalls[1].input.zona).toBe(3);
  });
});
