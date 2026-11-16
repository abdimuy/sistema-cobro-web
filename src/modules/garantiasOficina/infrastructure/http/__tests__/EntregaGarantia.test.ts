import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpGarantiasAdapter } from "../HttpGarantiasAdapter";

describe("Entrega de garantía multipart", () => {
  const identidad = {
    claveIdempotencia: "50f89b87-68f3-460c-a117-dfd313ddf281",
    deviceCreatedAt: "2026-11-13T14:00:00.000Z",
  };

  it("envía la firma, GPS y encabezado de idempotencia", async () => {
    const post = vi.fn().mockResolvedValue({ data: { ok: true } });
    const adapter = new HttpGarantiasAdapter(
      { post } as unknown as AxiosInstance,
    );

    const firma = new File(["imagen"], "firma.png", {
      type: "image/png",
    });

    await adapter.entregarGarantia(
      "garantia-1",
      firma,
      19.4326,
      -99.1332,
      identidad,
    );

    expect(post).toHaveBeenCalledTimes(1);

    const [ruta, cuerpo, opciones] = post.mock.calls[0];

    expect(ruta).toBe("/garantias/garantia-1/entregar");
    expect(cuerpo).toBeInstanceOf(FormData);
    expect(cuerpo.get("firma")).toBeInstanceOf(File);
    expect((cuerpo.get("firma") as File).name).toBe(firma.name);
    expect((cuerpo.get("firma") as File).size).toBe(firma.size);
    expect((cuerpo.get("firma") as File).type).toBe(firma.type);
    expect(cuerpo.get("gps_lat")).toBe("19.4326");
    expect(cuerpo.get("gps_lon")).toBe("-99.1332");
    expect(cuerpo.get("device_created_at"))
      .toBe(identidad.deviceCreatedAt);

    expect(opciones.headers["Idempotency-Key"])
      .toBe(identidad.claveIdempotencia);

    expect(opciones.headers["Content-Type"]).toBeUndefined();
  });

  it("reutiliza el archivo y la identidad al reintentar", async () => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    const adapter = new HttpGarantiasAdapter(
      { post } as unknown as AxiosInstance,
    );

    const firma = new File(["imagen"], "firma.jpg", {
      type: "image/jpeg",
    });

    await adapter.entregarGarantia(
      "garantia-1", firma, 19, -99, identidad,
    );
    await adapter.entregarGarantia(
      "garantia-1", firma, 19, -99, identidad,
    );

    expect(post).toHaveBeenCalledTimes(2);

    const primera = post.mock.calls[0];
    const segunda = post.mock.calls[1];

    expect(primera[1].get("firma")).toBeInstanceOf(File);
    expect((primera[1].get("firma") as File).name).toBe(firma.name);
    expect(segunda[1].get("firma")).toBeInstanceOf(File);
    expect((segunda[1].get("firma") as File).name).toBe(firma.name);
    expect(segunda[1].get("gps_lat"))
      .toBe(primera[1].get("gps_lat"));
    expect(segunda[1].get("gps_lon"))
      .toBe(primera[1].get("gps_lon"));
    expect(segunda[1].get("device_created_at"))
      .toBe(primera[1].get("device_created_at"));
    expect(segunda[2].headers)
      .toEqual(primera[2].headers);
  });
});
