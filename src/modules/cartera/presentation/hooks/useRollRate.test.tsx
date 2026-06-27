import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useRollRate } from "./useRollRate";
import {
  FakeCarteraPort,
  makeFakeRollRate,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { RollRate } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useRollRate", () => {
  it("fetches on mount and exposes the roll rate", async () => {
    const port = new FakeCarteraPort();
    port.rollRateResponse = makeFakeRollRate({ rollRate: 0.05 });
    const { result } = renderHook(() => useRollRate(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rollRate?.rollRate).toBe(0.05);
    expect(result.current.error).toBeNull();
    expect(port.rollRateCalls).toHaveLength(1);
  });

  it("exposes disponible:false when acumulando datos", async () => {
    const port = new FakeCarteraPort();
    port.rollRateResponse = makeFakeRollRate({ disponible: false });
    const { result } = renderHook(() => useRollRate(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rollRate?.disponible).toBe(false);
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerRollRate = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useRollRate(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.rollRate).toBeNull();
  });

  it("aborts the in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    port.rollRateResponse = (() =>
      new Promise<RollRate>(() => {})) as unknown as RollRate;

    const { unmount } = renderHook(() => useRollRate(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.rollRateCalls).toHaveLength(1));
    const { signal } = port.rollRateCalls[0];
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
