import { describe, expect, it } from "vitest";
import { obtenerBenchmark } from "./obtenerBenchmark";
import {
  FakeClientesPort,
  makeFakeBenchmark,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerBenchmark", () => {
  it("forwards clienteId and cohortBy to the port", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    await obtenerBenchmark(port, 1042, "zona");

    expect(port.benchmarkCalls).toHaveLength(1);
    expect(port.benchmarkCalls[0].clienteId).toBe(1042);
    expect(port.benchmarkCalls[0].cohortBy).toBe("zona");
  });

  it("forwards different cohortBy values", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    await obtenerBenchmark(port, 1042, "segmento");
    expect(port.benchmarkCalls[0].cohortBy).toBe("segmento");

    await obtenerBenchmark(port, 1042, "antiguedad");
    expect(port.benchmarkCalls[1].cohortBy).toBe("antiguedad");
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();

    const out = await obtenerBenchmark(port, 1042, "zona");
    expect(out.disponible).toBe(true);
    expect(out.zona).toBe("NORTE");
    expect(out.puntualidad.percentil).toBe(72);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    port.benchmarkResponse = makeFakeBenchmark();
    const ctrl = new AbortController();

    await obtenerBenchmark(port, 1042, "zona", ctrl.signal);
    expect(port.benchmarkCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerBenchmark(port, 0, "zona");
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerBenchmark(port, -1, "zona")).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerBenchmark(port, 1.5, "zona")).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "cliente no encontrado");
    port.throwOnNext.obtenerBenchmark = e;
    await expect(obtenerBenchmark(port, 1042, "zona")).rejects.toBe(e);
  });
});
