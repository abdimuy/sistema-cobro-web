import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useVentasCliente } from "./useVentasCliente";
import {
  FakeClientesPort,
  makeFakeVentaCliente,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useVentasCliente", () => {
  it("fetches first page on mount", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ doctoPvId: 1 })],
      nextCursor: "",
    };
    const { result } = renderHook(() => useVentasCliente(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ventas).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(port.listarVentasCalls).toHaveLength(1);
    expect(port.listarVentasCalls[0].input.clienteId).toBe(1042);
  });

  it("hasMore reflects nextCursor", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente()],
      nextCursor: "page2",
    };
    const { result } = renderHook(() => useVentasCliente(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it("loadMore appends items and updates hasMore", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ doctoPvId: 1 })],
      nextCursor: "cursor_p2",
    };

    const { result } = renderHook(() => useVentasCliente(1042), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ doctoPvId: 2 })],
      nextCursor: "",
    };

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.ventas).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(port.listarVentasCalls[1].input.cursor).toBe("cursor_p2");
  });

  it("resets when clienteId changes", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ doctoPvId: 1 })],
      nextCursor: "",
    };

    const { rerender, result } = renderHook(
      (props: { clienteId: number }) => useVentasCliente(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ doctoPvId: 99 })],
      nextCursor: "",
    };

    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.listarVentasCalls).toHaveLength(2));
    expect(port.listarVentasCalls[1].input.clienteId).toBe(2);
    await waitFor(() => expect(result.current.ventas).toHaveLength(1));
    expect(result.current.ventas[0].doctoPvId).toBe(99);
  });

  it("surfaces errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.listarVentas = Object.assign(new Error("error de red"), {
      code: "network_error",
    });
    const { result } = renderHook(() => useVentasCliente(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.ventas).toHaveLength(0);
  });

  it("refresh re-fetches with the same clienteId", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = { items: [], nextCursor: "" };
    const { result } = renderHook(() => useVentasCliente(1042), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() =>
      expect(port.listarVentasCalls.length).toBeGreaterThanOrEqual(2),
    );
    expect(port.listarVentasCalls[1].input.clienteId).toBe(1042);
  });
});
