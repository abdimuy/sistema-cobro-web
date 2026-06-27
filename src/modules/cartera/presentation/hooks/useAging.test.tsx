import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useAging } from "./useAging";
import {
  FakeCarteraPort,
  makeFakeAgingBucket,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { AgingBucket } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useAging", () => {
  it("fetches on mount and exposes buckets", async () => {
    const port = new FakeCarteraPort();
    port.agingResponse = [makeFakeAgingBucket({ bucket: "0-30" })];
    const { result } = renderHook(() => useAging(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.buckets).toHaveLength(1);
    expect(result.current.buckets[0].bucket).toBe("0-30");
    expect(result.current.error).toBeNull();
    expect(port.agingCalls).toHaveLength(1);
  });

  it("passes filters to the use case", async () => {
    const port = new FakeCarteraPort();
    port.agingResponse = [makeFakeAgingBucket()];
    const { result } = renderHook(
      () => useAging({ zona: "ZONA_NORTE" }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.agingCalls[0].filters).toMatchObject({ zona: "ZONA_NORTE" });
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerAging = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useAging(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.buckets).toHaveLength(0);
  });

  it("aborts the in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    port.agingResponse = (() =>
      new Promise<AgingBucket[]>(() => {})) as unknown as AgingBucket[];

    const { unmount } = renderHook(() => useAging(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.agingCalls).toHaveLength(1));
    const { signal } = port.agingCalls[0];
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
