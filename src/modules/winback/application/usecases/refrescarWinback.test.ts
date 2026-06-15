import { describe, expect, it } from "vitest";
import { refrescarWinback } from "./refrescarWinback";
import { FakeWinbackPort } from "../__tests__/fakeWinbackPort";
import { DomainError } from "../../domain/errors";

describe("refrescarWinback", () => {
  it("forwards the input to the port verbatim", async () => {
    const port = new FakeWinbackPort();
    port.refrescarResponse = { estado: "iniciado", mensaje: "lanzado" };

    const out = await refrescarWinback(port, { full: true });

    expect(port.refrescarCalls).toHaveLength(1);
    expect(port.refrescarCalls[0].input).toEqual({ full: true });
    expect(out.estado).toBe("iniciado");
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeWinbackPort();
    port.refrescarResponse = { estado: "ya_en_progreso", mensaje: "en curso" };

    const out = await refrescarWinback(port, { full: false });
    expect(out.estado).toBe("ya_en_progreso");
    expect(out.mensaje).toBe("en curso");
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeWinbackPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.refrescar = e;
    await expect(refrescarWinback(port, { full: false })).rejects.toBe(e);
  });
});
