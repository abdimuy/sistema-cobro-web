import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { BandejaProvider } from "../context/BandejaContext";
import { useCola } from "./useCola";
import { FakeBandejaPort, makeFakeConversacionResumen } from "../../application/__tests__/fakeBandejaPort";
import { DomainError } from "../../domain/errors";

function wrapWith(port: FakeBandejaPort) {
  return ({ children }: { children: ReactNode }) => (
    <BandejaProvider port={port}>{children}</BandejaProvider>
  );
}

// Uses vi fake timers throughout: waitFor's own internal polling relies on
// real timers, so instead of waitFor we flush microtasks/timers explicitly
// with vi.advanceTimersByTimeAsync inside act().
describe("useCola", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches on mount and again after 20s of polling", async () => {
    const port = new FakeBandejaPort();
    port.listarColaResponse = [makeFakeConversacionResumen()];
    const { result } = renderHook(() => useCola(), { wrapper: wrapWith(port) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(port.listarColaCalls).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(port.listarColaCalls).toHaveLength(2);
  });

  it("refetch() re-fetches immediately", async () => {
    const port = new FakeBandejaPort();
    port.listarColaResponse = [makeFakeConversacionResumen()];
    const { result } = renderHook(() => useCola(), { wrapper: wrapWith(port) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(port.listarColaCalls).toHaveLength(1);

    act(() => result.current.refetch());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(port.listarColaCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeBandejaPort();
    port.throwOnNext.listarCola = new DomainError("network_error", "error de red");
    const { result } = renderHook(() => useCola(), { wrapper: wrapWith(port) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("network_error");
    expect(result.current.items).toHaveLength(0);
  });
});
