import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useRitmoPago } from "./useRitmoPago";
import type { FichaDateRange } from "../../application/ports/ClientesPort";
import {
  FakeClientesPort,
  makeFakeRitmoPago,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useRitmoPago", () => {
  it("fetches on mount and exposes ritmo", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();
    const { result } = renderHook(() => useRitmoPago(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ritmo).not.toBeNull();
    expect(result.current.ritmo?.anclaDiaRuta).toBe("lunes");
    expect(result.current.error).toBeNull();
    expect(port.ritmoCalls).toHaveLength(1);
    expect(port.ritmoCalls[0].clienteId).toBe(1042);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerRitmoPago = Object.assign(new Error("not found"), {
      code: "cliente_no_encontrado",
    });
    const { result } = renderHook(() => useRitmoPago(9999), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.ritmo).toBeNull();
  });

  it("re-fetches when clienteId changes", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    const { rerender } = renderHook(
      (props: { clienteId: number }) => useRitmoPago(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(1));

    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(2));
    expect(port.ritmoCalls[1].clienteId).toBe(2);
  });

  it("refresh re-fetches with the same clienteId", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();
    const { result } = renderHook(() => useRitmoPago(1042), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.ritmoCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.ritmoCalls[1].clienteId).toBe(1042);
  });

  it("re-fetches when range changes", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    const { rerender } = renderHook(
      (props: { range: FichaDateRange }) => useRitmoPago(1042, props.range),
      { wrapper: wrapWith(port), initialProps: { range: {} } },
    );
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(1));

    rerender({ range: { desde: "2026-01-01", hasta: "2026-06-30" } });
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(2));
    expect(port.ritmoCalls[1].range).toEqual({ desde: "2026-01-01", hasta: "2026-06-30" });
  });

  it("passes range to the port", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    renderHook(
      () => useRitmoPago(1042, { desde: "2026-01-01", hasta: "2026-03-31" }),
      { wrapper: wrapWith(port) },
    );
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(1));
    expect(port.ritmoCalls[0].range).toEqual({ desde: "2026-01-01", hasta: "2026-03-31" });
  });

  it("passes no range when hook called without range arg", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    renderHook(() => useRitmoPago(1042), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.ritmoCalls).toHaveLength(1));
    expect(port.ritmoCalls[0].range).toBeUndefined();
  });
});
