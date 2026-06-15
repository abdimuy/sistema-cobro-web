import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { WinbackProvider } from "../context/WinbackContext";
import { useListarWinback } from "./useListarWinback";
import {
  FakeWinbackPort,
  makeFakeWinbackItem,
} from "../../application/__tests__/fakeWinbackPort";

function wrapWith(port: FakeWinbackPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <WinbackProvider port={port}>{children}</WinbackProvider>
  );
}

describe("useListarWinback", () => {
  it("fetches on mount and exposes items", async () => {
    const port = new FakeWinbackPort();
    port.listarResponse = {
      items: [makeFakeWinbackItem({ clienteId: 1 })],
    };
    const { result } = renderHook(() => useListarWinback(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(port.listarCalls).toHaveLength(1);
  });

  it("passes filter fields to the use case", async () => {
    const port = new FakeWinbackPort();
    port.listarResponse = { items: [] };
    const { result } = renderHook(
      () => useListarWinback({ segmento: "DORMIDO_VALIOSO", zona: "NORTE", limit: 10 }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.listarCalls[0].input).toMatchObject({
      segmento: "DORMIDO_VALIOSO",
      zona: "NORTE",
      limit: 10,
    });
  });

  it("re-fetches when a filter primitive changes", async () => {
    const port = new FakeWinbackPort();
    port.listarResponse = { items: [] };

    const { rerender } = renderHook(
      (props: { zona?: string }) => useListarWinback({ zona: props.zona }),
      { wrapper: wrapWith(port), initialProps: { zona: "NORTE" } },
    );
    await waitFor(() => expect(port.listarCalls).toHaveLength(1));

    rerender({ zona: "SUR" });
    await waitFor(() => expect(port.listarCalls).toHaveLength(2));
    expect(port.listarCalls[1].input.zona).toBe("SUR");
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeWinbackPort();
    port.throwOnNext.listarItems = Object.assign(new Error("network failure"), {
      code: "network_error",
    });
    const { result } = renderHook(() => useListarWinback(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.items).toHaveLength(0);
  });

  it("refresh re-fetches with the same filters", async () => {
    const port = new FakeWinbackPort();
    port.listarResponse = { items: [] };
    const { result } = renderHook(() => useListarWinback({ zona: "NORTE" }), {
      wrapper: wrapWith(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.listarCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.listarCalls[1].input.zona).toBe("NORTE");
  });
});
