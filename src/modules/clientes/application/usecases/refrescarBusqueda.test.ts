import { describe, expect, it } from "vitest";
import { refrescarBusqueda } from "./refrescarBusqueda";
import { FakeClientesPort } from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("refrescarBusqueda", () => {
  it("delegates to the port with no input", async () => {
    const port = new FakeClientesPort();
    port.refrescarResponse = { reindexado: true, documentos: 342 };

    const out = await refrescarBusqueda(port);

    expect(port.refrescarCalls).toHaveLength(1);
    expect(out.reindexado).toBe(true);
    expect(out.documentos).toBe(342);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    port.refrescarResponse = { reindexado: false, documentos: 0 };

    const out = await refrescarBusqueda(port);
    expect(out.reindexado).toBe(false);
    expect(out.documentos).toBe(0);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("reindex_failed", "fallo al reindexar");
    port.throwOnNext.refrescarBusqueda = e;
    await expect(refrescarBusqueda(port)).rejects.toBe(e);
  });
});
