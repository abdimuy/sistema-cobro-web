import { afterEach, describe, expect, it, vi } from "vitest";
import { ventaV2Http } from "./ventaV2Types";
import { getVentaArchivo, rutaImagenArchivo } from "./getVentaArchivo";

describe("getVentaArchivo", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide GET /ventas/archivo/{id}", async () => {
    const data = { id: "a1" };
    const get = vi.spyOn(ventaV2Http, "get").mockResolvedValue({ data });
    const ctrl = new AbortController();
    await expect(getVentaArchivo("a1", ctrl.signal)).resolves.toBe(data);
    expect(get).toHaveBeenCalledWith("/ventas/archivo/a1", { signal: ctrl.signal });
  });

  it("rutaImagenArchivo arma /ventas/archivo/{id}/imagenes/{img}", () => {
    expect(rutaImagenArchivo("v1", "i1")).toBe("/ventas/archivo/v1/imagenes/i1");
  });
});
