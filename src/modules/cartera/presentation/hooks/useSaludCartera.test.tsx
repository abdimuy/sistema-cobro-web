import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useSaludCartera } from "./useSaludCartera";
import {
  FakeCarteraPort,
  makeFakeSaludCartera,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { SaludCartera } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useSaludCartera", () => {
  it("fetches on mount and exposes salud", async () => {
    const port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera({ saldoTotal: "100000.00" });
    const { result } = renderHook(() => useSaludCartera(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.salud).not.toBeNull();
    expect(result.current.salud?.saldoTotal).toBe("100000.00");
    expect(result.current.error).toBeNull();
    expect(port.saludCalls).toHaveLength(1);
  });

  it("passes filters to the use case", async () => {
    const port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera();
    const { result } = renderHook(
      () => useSaludCartera({ zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.saludCalls[0].filters).toMatchObject({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("re-fetches when a filter primitive changes", async () => {
    const port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera();

    const { rerender } = renderHook(
      (props: { zona?: string }) => useSaludCartera({ zona: props.zona }),
      { wrapper: wrapWith(port), initialProps: { zona: "ZONA_NORTE" } },
    );
    await waitFor(() => expect(port.saludCalls).toHaveLength(1));

    rerender({ zona: "ZONA_SUR" });
    await waitFor(() => expect(port.saludCalls).toHaveLength(2));
    expect(port.saludCalls[1].filters.zona).toBe("ZONA_SUR");
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerSalud = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useSaludCartera(), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.salud).toBeNull();
  });

  it("refresh re-fetches with the same filters", async () => {
    const port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera();
    const { result } = renderHook(
      () => useSaludCartera({ zona: "ZONA_NORTE" }),
      { wrapper: wrapWith(port) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refresh());
    await waitFor(() => expect(port.saludCalls.length).toBeGreaterThanOrEqual(2));
    expect(port.saludCalls[1].filters.zona).toBe("ZONA_NORTE");
  });

  it("aborts the in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    // Never-resolving response keeps the request in-flight
    port.saludResponse = (() =>
      new Promise<SaludCartera>(() => {})) as unknown as SaludCartera;

    const { unmount } = renderHook(() => useSaludCartera(), {
      wrapper: wrapWith(port),
    });

    // Wait for the call to register so signal is available
    await waitFor(() => expect(port.saludCalls).toHaveLength(1));
    const { signal } = port.saludCalls[0];
    expect(signal).toBeDefined();
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
