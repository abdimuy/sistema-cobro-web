import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { WinbackProvider } from "../context/WinbackContext";
import { useRefrescarWinback } from "./useRefrescarWinback";
import { FakeWinbackPort } from "../../application/__tests__/fakeWinbackPort";

function wrapWith(port: FakeWinbackPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <WinbackProvider port={port}>{children}</WinbackProvider>
  );
}

describe("useRefrescarWinback", () => {
  it("does NOT auto-fetch on mount", () => {
    const port = new FakeWinbackPort();
    renderHook(() => useRefrescarWinback(), { wrapper: wrapWith(port) });
    expect(port.refrescarCalls).toHaveLength(0);
  });

  it("calling refrescar() triggers the use case and returns the result", async () => {
    const port = new FakeWinbackPort();
    port.refrescarResponse = { estado: "iniciado", mensaje: "en cola" };
    const { result } = renderHook(() => useRefrescarWinback(), {
      wrapper: wrapWith(port),
    });

    let returnedResult: Awaited<ReturnType<typeof result.current.refrescar>>;
    await act(async () => {
      returnedResult = await result.current.refrescar();
    });

    expect(port.refrescarCalls).toHaveLength(1);
    expect(port.refrescarCalls[0].input).toEqual({ full: false });
    expect(returnedResult!).toEqual({ estado: "iniciado", mensaje: "en cola" });
    expect(result.current.result).toEqual({ estado: "iniciado", mensaje: "en cola" });
    expect(result.current.error).toBeNull();
  });

  it("calling refrescar(true) forwards full=true to the port", async () => {
    const port = new FakeWinbackPort();
    const { result } = renderHook(() => useRefrescarWinback(), {
      wrapper: wrapWith(port),
    });

    await act(async () => {
      await result.current.refrescar(true);
    });

    expect(port.refrescarCalls[0].input.full).toBe(true);
  });

  it("sets isLoading during the request and clears it after", async () => {
    const port = new FakeWinbackPort();
    const { result } = renderHook(() => useRefrescarWinback(), {
      wrapper: wrapWith(port),
    });

    expect(result.current.isLoading).toBe(false);
    await act(async () => {
      await result.current.refrescar();
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("error path: returns null and sets error state", async () => {
    const port = new FakeWinbackPort();
    port.throwOnNext.refrescar = new Error("server error");
    const { result } = renderHook(() => useRefrescarWinback(), {
      wrapper: wrapWith(port),
    });

    let returnedResult: Awaited<ReturnType<typeof result.current.refrescar>>;
    await act(async () => {
      returnedResult = await result.current.refrescar();
    });

    expect(returnedResult!).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.result).toBeNull();
  });
});
