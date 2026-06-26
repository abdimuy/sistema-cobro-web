import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ClientesProvider } from "../context/ClientesContext";
import { useTimeline } from "./useTimeline";
import { FakeClientesPort } from "../../application/__tests__/fakeClientesPort";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useTimeline", () => {
  it("fetches on mount and exposes timeline", async () => {
    const port = new FakeClientesPort();
    const { result } = renderHook(() => useTimeline(1042), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.timeline).toHaveLength(3);
    expect(result.current.error).toBeNull();
    expect(port.timelineCalls[0].clienteId).toBe(1042);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerTimeline = Object.assign(new Error("not found"), { code: "cliente_no_encontrado" });
    const { result } = renderHook(() => useTimeline(9999), { wrapper: wrapWith(port) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.timeline).toHaveLength(0);
  });

  it("re-fetches when clienteId changes", async () => {
    const port = new FakeClientesPort();
    const { rerender } = renderHook(
      (props: { clienteId: number }) => useTimeline(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.timelineCalls).toHaveLength(1));
    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.timelineCalls).toHaveLength(2));
    expect(port.timelineCalls[1].clienteId).toBe(2);
  });

  it("passes signal to the port", async () => {
    const port = new FakeClientesPort();
    renderHook(() => useTimeline(1042), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.timelineCalls).toHaveLength(1));
    expect(port.timelineCalls[0].signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts in-flight signal when clienteId changes", async () => {
    const port = new FakeClientesPort();
    const { rerender } = renderHook(
      (props: { clienteId: number }) => useTimeline(props.clienteId),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.timelineCalls).toHaveLength(1));
    const firstSignal = port.timelineCalls[0].signal!;
    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.timelineCalls).toHaveLength(2));
    expect(firstSignal.aborted).toBe(true);
  });
});
