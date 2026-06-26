import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { ClientesProvider } from "../context/ClientesContext";
import { useBenchmark } from "./useBenchmark";
import {
  FakeClientesPort,
  makeFakeBenchmark,
} from "../../application/__tests__/fakeClientesPort";
import type { CohortBy } from "../../domain/entities/Benchmark";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("useBenchmark", () => {
  it("fetches on mount and exposes benchmark", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    const { result } = renderHook(() => useBenchmark(1042, "zona"), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.benchmark).not.toBeNull();
    expect(result.current.benchmark?.disponible).toBe(true);
    expect(result.current.benchmark?.zona).toBe("NORTE");
    expect(result.current.error).toBeNull();
    expect(port.benchmarkCalls).toHaveLength(1);
    expect(port.benchmarkCalls[0].clienteId).toBe(1042);
    expect(port.benchmarkCalls[0].cohortBy).toBe("zona");
  });

  it("surfaces port errors as DomainError state", async () => {
    const port = new FakeClientesPort();
    port.throwOnNext.obtenerBenchmark = Object.assign(new Error("not found"), {
      code: "cliente_no_encontrado",
    });
    const { result } = renderHook(() => useBenchmark(9999, "zona"), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.benchmark).toBeNull();
  });

  it("re-fetches when clienteId changes", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    const { rerender } = renderHook(
      (props: { clienteId: number }) => useBenchmark(props.clienteId, "zona"),
      { wrapper: wrapWith(port), initialProps: { clienteId: 1 } },
    );
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(1));

    rerender({ clienteId: 2 });
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(2));
    expect(port.benchmarkCalls[1].clienteId).toBe(2);
  });

  it("re-fetches when cohortBy changes", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    const { rerender } = renderHook(
      (props: { cohortBy: "zona" | "segmento" | "antiguedad" }) =>
        useBenchmark(1042, props.cohortBy),
      { wrapper: wrapWith(port), initialProps: { cohortBy: "zona" as CohortBy } },
    );
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(1));
    expect(port.benchmarkCalls[0].cohortBy).toBe("zona");

    rerender({ cohortBy: "segmento" });
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(2));
    expect(port.benchmarkCalls[1].cohortBy).toBe("segmento");
  });

  it("passes clienteId, cohortBy, and signal to the port", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    renderHook(() => useBenchmark(1042, "zona"), { wrapper: wrapWith(port) });
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(1));
    expect(port.benchmarkCalls[0].signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts in-flight signal when cohortBy changes", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    const { rerender } = renderHook(
      (props: { cohortBy: "zona" | "segmento" | "antiguedad" }) =>
        useBenchmark(1042, props.cohortBy),
      { wrapper: wrapWith(port), initialProps: { cohortBy: "zona" as CohortBy } },
    );

    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(1));
    const firstSignal = port.benchmarkCalls[0].signal!;

    rerender({ cohortBy: "segmento" });
    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(2));

    expect(firstSignal.aborted).toBe(true);
  });

  it("aborts signal when component unmounts", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    const { unmount } = renderHook(() => useBenchmark(1042, "zona"), {
      wrapper: wrapWith(port),
    });

    await waitFor(() => expect(port.benchmarkCalls).toHaveLength(1));
    const signal = port.benchmarkCalls[0].signal!;

    unmount();
    expect(signal.aborted).toBe(true);
  });
});
