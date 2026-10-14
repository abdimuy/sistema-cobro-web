import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpClientesAdapter } from "./HttpClientesAdapter";

describe("HttpClientesAdapter — fotos de pago", () => {
  it("lista /cobranza/pagos/{id}/imagenes y mapea", async () => {
    const get = vi.fn().mockResolvedValue({
      data: [{ id: "img-1", mime: "image/jpeg", size_bytes: 1024, created_at: "2026-10-14T14:20:10Z", updated_at: "2026-10-14T14:20:10Z" }],
    });
    const adapter = new HttpClientesAdapter({ get } as unknown as AxiosInstance);
    const imgs = await adapter.listarImagenesPago("p-1");
    expect(get).toHaveBeenCalledWith("/cobranza/pagos/p-1/imagenes", { signal: undefined });
    expect(imgs).toEqual([
      { id: "img-1", mime: "image/jpeg", sizeBytes: 1024, descripcion: null, createdAt: "2026-10-14T14:20:10Z", updatedAt: "2026-10-14T14:20:10Z" },
    ]);
  });

  it("descarga una foto como blob", async () => {
    const blob = new Blob(["jpg"]);
    const get = vi.fn().mockResolvedValue({ data: blob });
    const adapter = new HttpClientesAdapter({ get } as unknown as AxiosInstance);
    await expect(adapter.descargarImagenPago("p-1", "img-1")).resolves.toBe(blob);
    expect(get).toHaveBeenCalledWith("/cobranza/pagos/p-1/imagenes/img-1", { responseType: "blob", signal: undefined });
  });
});
