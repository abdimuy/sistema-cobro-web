import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useFichaCliente } from "./useFichaCliente";
import {
  FakeClientesPort,
  makeFakeFichaCliente,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useFichaCliente", () => {
  it("fetches on mount and exposes ficha", async () => {
    const port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente({ clienteId: 1042 });
    const { result } = renderHook(() => useFichaCliente(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ficha).not.toBeNull();
    expect(result.current.ficha?.clienteId).toBe(1042);
    expect(result.current.error).toBeNull();
    expect(port.fichaCalls).toHaveLength(1);
    expect(port.fichaCalls[0].clienteId).toBe(1042);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerFicha = Object.assign(new Error("not found"), {
      code: "cliente_no_encontrado",
    });
    const { result } = renderHook(() => useFichaCliente(9999), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.ficha).toBeNull();
  });

  it("re-fetches when clienteId changes", async () => {
    const port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente();

    const { rerender } = renderHook(
      (props: { clienteId: number }) => useFichaCliente(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.fichaCalls).toHaveLength(1));

    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.fichaCalls).toHaveLength(2));
    expect(port.fichaCalls[1].clienteId).toBe(2);
  });

  it("refresh re-fetches with the same clienteId", async () => {
    const port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente();
    const { result } = renderHook(() => useFichaCliente(1042), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.fichaCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.fichaCalls[1].clienteId).toBe(1042);
  });
});
