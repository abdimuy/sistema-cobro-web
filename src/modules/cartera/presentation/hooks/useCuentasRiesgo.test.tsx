import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { CarteraProvider } from "../context/CarteraContext";
import { useCuentasRiesgo } from "./useCuentasRiesgo";
import {
  FakeCarteraPort,
  makeFakeCuentaRiesgo,
} from "../../application/__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";
import type { CuentaRiesgo } from "../../domain/entities";

function wrapWith(port: FakeCarteraPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <CarteraProvider port={port}>{children}</CarteraProvider>
  );
}

describe("useCuentasRiesgo", () => {
  it("fetches on mount and exposes cuentas", async () => {
    const port = new FakeCarteraPort();
    port.cuentasRiesgoResponse = [makeFakeCuentaRiesgo({ clienteId: 9999 })];
    const { result } = renderHook(() => useCuentasRiesgo(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cuentas).toHaveLength(1);
    expect(result.current.cuentas[0].clienteId).toBe(9999);
    expect(result.current.error).toBeNull();
    expect(port.cuentasRiesgoCalls).toHaveLength(1);
  });

  it("calls port with empty filters (portfolio-wide)", async () => {
    const port = new FakeCarteraPort();
    port.cuentasRiesgoResponse = [makeFakeCuentaRiesgo()];
    const { result } = renderHook(() => useCuentasRiesgo(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.cuentasRiesgoCalls[0].filters).toEqual({});
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeCarteraPort();
    port.throwOnNext.obtenerCuentasRiesgo = new DomainError("network_error", "fallo de red");
    const { result } = renderHook(() => useCuentasRiesgo(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.cuentas).toHaveLength(0);
  });

  it("aborts the in-flight request on unmount", async () => {
    const port = new FakeCarteraPort();
    port.cuentasRiesgoResponse = (() =>
      new Promise<CuentaRiesgo[]>(() => {})) as unknown as CuentaRiesgo[];

    const { unmount } = renderHook(() => useCuentasRiesgo(), { wrapper: wrapWith(port) });

    await waitFor(() => expect(port.cuentasRiesgoCalls).toHaveLength(1));
    const { signal } = port.cuentasRiesgoCalls[0];
    expect(signal!.aborted).toBe(false);

    unmount();
    expect(signal!.aborted).toBe(true);
  });
});
