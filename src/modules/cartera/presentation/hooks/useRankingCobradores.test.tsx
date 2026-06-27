import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useRankingCobradores } from "./useRankingCobradores";
import {
  FakeCarteraPort,
  makeFakeCobradorPerformance,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { CobradorPerformance } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useRankingCobradores", () => {
  it("fetches on mount and exposes cobradores", async () => {
    const port = new FakeCarteraPort();
    port.cobradoresResponse = [makeFakeCobradorPerformance({ cobradorId: 3 })];
    const { result } = renderHook(() => useRankingCobradores(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cobradores).toHaveLength(1);
    expect(result.current.cobradores[0].cobradorId).toBe(3);
    expect(result.current.error).toBeNull();
    expect(port.cobradoresCalls).toHaveLength(1);
  });

  it("passes filters to the use case", async () => {
    const port = new FakeCarteraPort();
    port.cobradoresResponse = [makeFakeCobradorPerformance()];
    const { result } = renderHook(
      () => useRankingCobradores({ zona: "ZONA_SUR" }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.cobradoresCalls[0].filters).toMatchObject({ zona: "ZONA_SUR" });
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerCobradores = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useRankingCobradores(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.cobradores).toHaveLength(0);
  });

  it("aborts the in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    port.cobradoresResponse = (() =>
      new Promise<CobradorPerformance[]>(() => {})) as unknown as CobradorPerformance[];

    const { unmount } = renderHook(() => useRankingCobradores(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.cobradoresCalls).toHaveLength(1));
    const { signal } = port.cobradoresCalls[0];
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
