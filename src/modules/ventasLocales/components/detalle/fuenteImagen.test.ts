import { afterEach, describe, expect, it, vi } from "vitest";
import { ventaV2Http } from "@/services/api/ventaV2Types";
import { fuenteImagenVenta } from "./fuenteImagen";

describe("fuenteImagenVenta (Ventas Locales sigue igual)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide /ventas/{venta}/imagenes/{imagen} como blob, con la misma clave de caché por venta", async () => {
    const blob = new Blob(["jpg"]);
    const get = vi.spyOn(ventaV2Http, "get").mockResolvedValue({ data: blob });
    const fuente = fuenteImagenVenta("v-1", "img-9");
    expect(fuente.cacheKey).toBe("venta/v-1/img-9");
    await expect(fuente.descargar()).resolves.toBe(blob);
    expect(get).toHaveBeenCalledWith("/ventas/v-1/imagenes/img-9", { responseType: "blob" });
  });
});
