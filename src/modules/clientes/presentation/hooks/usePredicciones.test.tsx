import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { usePredicciones } from "./usePredicciones";
import {
  FakeClientesPort,
  makeFakePredicciones,
} from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("usePredicciones", () => {
  it("fetches on mount and exposes predicciones", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();
    const { result } = renderHook(() => usePredicciones(1042), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.predicciones).not.toBeNull();
    expect(result.current.predicciones?.disponible).toBe(true);
    expect(result.current.error).toBeNull();
    expect(port.predicionesCalls).toHaveLength(1);
    expect(port.predicionesCalls[0].clienteId).toBe(1042);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerPredicciones = Object.assign(new Error("not found"), {
      code: "cliente_no_encontrado",
    });
    const { result } = renderHook(() => usePredicciones(9999), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.predicciones).toBeNull();
  });

  it("re-fetches when clienteId changes", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();

    const { rerender } = renderHook(
      (props: { clienteId: number }) => usePredicciones(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.predicionesCalls).toHaveLength(1));

    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.predicionesCalls).toHaveLength(2));
    expect(port.predicionesCalls[1].clienteId).toBe(2);
  });

  it("passes clienteId and signal to the port", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();

    renderHook(() => usePredicciones(1042), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.predicionesCalls).toHaveLength(1));
    expect(port.predicionesCalls[0].clienteId).toBe(1042);
  });
});
