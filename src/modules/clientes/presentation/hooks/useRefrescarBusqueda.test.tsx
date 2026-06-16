import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useRefrescarBusqueda } from "./useRefrescarBusqueda";
import { FakeClientesPort } from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useRefrescarBusqueda", () => {
  it("does not fetch on mount", () => {
    const port = new FakeClientesPort();
    const { result } = renderHook(() => useRefrescarBusqueda(), {
      wrapper: wrapWith(port),
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(port.refrescarCalls).toHaveLength(0);
  });

  it("refrescar triggers the call and exposes result", async () => {
    const port = new FakeClientesPort();
    port.refrescarResponse = { reindexado: true, documentos: 157 };

    const { result } = renderHook(() => useRefrescarBusqueda(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.refrescar();
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.result).toEqual({ reindexado: true, documentos: 157 });
    expect(result.current.error).toBeNull();
    expect(port.refrescarCalls).toHaveLength(1);
  });

  it("surfaces errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.refrescarBusqueda = Object.assign(
      new Error("reindex falló"),
      { code: "reindex_error" },
    );

    const { result } = renderHook(() => useRefrescarBusqueda(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.refrescar();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.result).toBeNull();
  });
});
