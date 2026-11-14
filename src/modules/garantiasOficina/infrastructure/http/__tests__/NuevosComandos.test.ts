import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpGarantiasAdapter } from "../HttpGarantiasAdapter";

const identidad = {
  claveIdempotencia: "11111111-1111-4111-8111-111111111111",
  deviceCreatedAt: "2026-11-14T15:00:00.000Z",
};

describe("Nuevos comandos de Garantías Oficina", () => {
  function crearAdapter() {
    const post = vi.fn().mockResolvedValue({ data: { ok: true } });
    const client = { post } as unknown as AxiosInstance;
    return { adapter: new HttpGarantiasAdapter(client), post };
  }

  it("agrega artículos con idempotencia", async () => {
    const { adapter, post } = crearAdapter();

    await adapter.agregarArticulo(
      "folio-1",
      { clave: "PISO-001", description: "Sillón de prueba" },
      identidad,
    );

    expect(post).toHaveBeenCalledWith(
      "/garantias/folio-1/articulos",
      {
        clave: "PISO-001",
        description: "Sillón de prueba",
        device_created_at: identidad.deviceCreatedAt,
      },
      expect.objectContaining({
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
      }),
    );
  });

  it("avanza la etapa del artículo", async () => {
    const { adapter, post } = crearAdapter();

    await adapter.avanzarArticulo(
      "folio-1",
      "articulo-1",
      { etapa_destino: "en_revision" },
      identidad,
    );

    expect(post).toHaveBeenCalledWith(
      "/garantias/folio-1/articulos/articulo-1/avanzar",
      {
        etapa_destino: "en_revision",
        device_created_at: identidad.deviceCreatedAt,
      },
      expect.objectContaining({
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
      }),
    );
  });

  it("inicia el proceso de un folio", async () => {
    const { adapter, post } = crearAdapter();

    await adapter.ejecutarComandoFolio(
      "folio-1",
      { tipo: "iniciar-proceso" },
      identidad,
    );

    expect(post).toHaveBeenCalledWith(
      "/garantias/folio-1/iniciar-proceso",
      {
        device_created_at: identidad.deviceCreatedAt,
      },
      expect.objectContaining({
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
      }),
    );
  });
});
