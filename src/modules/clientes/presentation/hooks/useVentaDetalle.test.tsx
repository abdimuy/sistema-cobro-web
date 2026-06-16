import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useVentaDetalle } from "./useVentaDetalle";
import {
  FakeClientesPort,
  makeFakeVentaDetalle,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useVentaDetalle", () => {
  it("returns null state when doctoPvId is null (no fetch)", () => {
    const port = new FakeClientesPort();
    const { result } = renderHook(() => useVentaDetalle(1042, null), {
      wrapper: wrapWith(port),
    });

    expect(result.current.detalle).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(port.obtenerDetalleCalls).toHaveLength(0);
  });

  it("fetches when doctoPvId is set", async () => {
    const port = new FakeClientesPort();
    port.obtenerDetalleResponse = makeFakeVentaDetalle();
    const { result } = renderHook(() => useVentaDetalle(1042, 30015), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.detalle).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(port.obtenerDetalleCalls).toHaveLength(1);
    expect(port.obtenerDetalleCalls[0].input).toEqual({
      clienteId: 1042,
      doctoPvId: 30015,
    });
  });

  it("surfaces errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerVentaDetalle = Object.assign(
      new Error("venta no encontrada"),
      { code: "venta_no_encontrada" },
    );
    const { result } = renderHook(() => useVentaDetalle(1042, 99999), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.detalle).toBeNull();
  });

  it("re-fetches when doctoPvId changes", async () => {
    const port = new FakeClientesPort();
    port.obtenerDetalleResponse = makeFakeVentaDetalle();

    const { rerender } = renderHook(
      (props: { doctoPvId: number | null }) =>
        useVentaDetalle(1042, props.doctoPvId),
      { wrapper: wrapWith(port), initialProps: { doctoPvId: 100 } },
    );
    await waitFor(() => expect(port.obtenerDetalleCalls).toHaveLength(1));

    rerender({ doctoPvId: 200 });
    await waitFor(() => expect(port.obtenerDetalleCalls).toHaveLength(2));
    expect(port.obtenerDetalleCalls[1].input.doctoPvId).toBe(200);
  });

  it("clears detalle when doctoPvId becomes null", async () => {
    const port = new FakeClientesPort();
    port.obtenerDetalleResponse = makeFakeVentaDetalle();

    const { result, rerender } = renderHook(
      (props: { doctoPvId: number | null }) =>
        useVentaDetalle(1042, props.doctoPvId),
      { wrapper: wrapWith(port), initialProps: { doctoPvId: 100 as number | null } },
    );
    await waitFor(() => expect(result.current.detalle).not.toBeNull());

    rerender({ doctoPvId: null });
    expect(result.current.detalle).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
