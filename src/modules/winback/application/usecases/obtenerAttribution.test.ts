import { describe, expect, it } from "vitest";
import { obtenerAttribution } from "./obtenerAttribution";
import {
  FakeWinbackPort,
  makeFakeAttribution,
} from "../__tests__/fakeWinbackPort";
import { DomainError } from "../../domain/errors";

describe("obtenerAttribution", () => {
  it("forwards the input to the port verbatim", async () => {
    const port = new FakeWinbackPort();
    const expected = makeFakeAttribution({ uplift: "0.35" });
    port.attributionResponse = expected;

    const out = await obtenerAttribution(port, { zona: "ZONA_NORTE" });

    expect(port.attributionCalls).toHaveLength(1);
    expect(port.attributionCalls[0].input).toEqual({ zona: "ZONA_NORTE" });
    expect(out.uplift).toBe("0.35");
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeWinbackPort();
    const attribution = makeFakeAttribution({ treatmentConvertidos: 30 });
    port.attributionResponse = attribution;

    const out = await obtenerAttribution(port, {});
    expect(out.treatmentConvertidos).toBe(30);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeWinbackPort();
    const ctrl = new AbortController();
    await obtenerAttribution(port, {}, ctrl.signal);
    expect(port.attributionCalls[0].signal).toBe(ctrl.signal);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeWinbackPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.obtenerAttribution = e;
    await expect(obtenerAttribution(port, {})).rejects.toBe(e);
  });
});
