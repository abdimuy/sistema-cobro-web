import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useCosechas } from "./useCosechas";
import {
  FakeCarteraPort,
  makeFakeCosecha,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { Cosecha } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useCosechas", () => {
  it("fetches on mount and exposes cosechas array", async () => {
    const port = new FakeCarteraPort();
    port.cosechasResponse = [makeFakeCosecha({ cohortMonth: 24318, conteo: 10 })];
    const { result } = renderHook(() => useCosechas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cosechas).toHaveLength(1);
    expect(result.current.cosechas[0].cohortMonth).toBe(24318);
    expect(result.current.error).toBeNull();
    expect(port.cosechasCalls).toHaveLength(1);
  });

  it("re-fetches when filter changes", async () => {
    const port = new FakeCarteraPort();
    port.cosechasResponse = [makeFakeCosecha()];

    let zona: string | undefined = undefined;
    const { result, rerender } = renderHook(
      () => useCosechas({ zona }),
      { wrapper: wrapWith(port) },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.cosechasCalls).toHaveLength(1);

    zona = "ZONA_NORTE";
    rerender();

    await waitFor(() => expect(port.cosechasCalls).toHaveLength(2));
    expect(port.cosechasCalls[1].filters.zona).toBe("ZONA_NORTE");
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerCosechas = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useCosechas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.cosechas).toHaveLength(0);
  });

  it("exposes isLoading:true while port has not resolved (Sin datos stays hidden)", async () => {
    const port = new FakeCarteraPort();
    port.cosechasResponse = (() =>
      new Promise<Cosecha[]>(() => {})) as unknown as Cosecha[];

    const { result } = renderHook(() => useCosechas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.cosechasCalls).toHaveLength(1));
    // While in flight: isLoading is true, cosechas is empty
    // → CarteraCosechas renders skeleton (cosechas.length===0 && isLoading), not "Sin datos"
    expect(result.current.isLoading).toBe(true);
    expect(result.current.cosechas).toHaveLength(0);
  });

  it("aborts in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    port.cosechasResponse = (() =>
      new Promise<Cosecha[]>(() => {})) as unknown as Cosecha[];

    const { unmount } = renderHook(() => useCosechas(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.cosechasCalls).toHaveLength(1));
    const { signal } = port.cosechasCalls[0];
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
