import { describe, expect, it } from "vitest";

import type { VentaEvento } from "../domain/entities/VentaEvento";
import { faseHitos } from "./faseHitos";

const evento = (eventType: string, iso: string, id = iso): VentaEvento => ({
  id: `${eventType}-${id}`,
  eventType,
  payload: {},
  occurredAt: new Date(iso),
  actorNombre: "Brayan Javier Roque",
});

describe("faseHitos", () => {
  it("sin eventos deja los cuatro hitos pendientes", () => {
    const hitos = faseHitos([]);

    expect(hitos.map((h) => h.clave)).toEqual([
      "capturada",
      "revisada",
      "aprobada",
      "aplicada",
    ]);
    expect(hitos.every((h) => h.fecha === null)).toBe(true);
  });

  it("fecha los hitos que la bitácora alcanzó y deja pendiente el resto", () => {
    const hitos = faseHitos([
      evento("venta.creada", "2026-08-12T11:04:00Z"),
      evento("venta.enviada_a_revision", "2026-08-12T18:22:00Z"),
      evento("venta.aprobada", "2026-08-12T19:40:00Z"),
    ]);

    expect(hitos[0].fecha?.toISOString()).toBe("2026-08-12T11:04:00.000Z");
    expect(hitos[2].fecha?.toISOString()).toBe("2026-08-12T19:40:00.000Z");
    expect(hitos[3].fecha).toBeNull();
  });

  it("con vueltas repetidas gana la última: la venta pudo regresar a borrador", () => {
    const hitos = faseHitos([
      evento("venta.aprobada", "2026-08-12T19:40:00Z", "a"),
      evento("venta.regresada_a_borrador", "2026-08-13T09:00:00Z"),
      evento("venta.aprobada", "2026-08-14T10:15:00Z", "b"),
    ]);

    expect(hitos[2].fecha?.toISOString()).toBe("2026-08-14T10:15:00.000Z");
  });

  it("cancelada cierra la historia y borra los pendientes", () => {
    const hitos = faseHitos([
      evento("venta.creada", "2026-08-12T11:04:00Z"),
      evento("venta.enviada_a_revision", "2026-08-12T18:22:00Z"),
      evento("venta.cancelada", "2026-08-13T08:10:00Z"),
    ]);

    expect(hitos.map((h) => h.clave)).toEqual(["capturada", "revisada", "cancelada"]);
    expect(hitos.every((h) => h.fecha !== null)).toBe(true);
  });

  it("una venta cancelada después de Microsip conserva el hito aplicada", () => {
    const hitos = faseHitos([
      evento("venta.creada", "2026-08-12T11:04:00Z"),
      evento("venta.aprobada", "2026-08-12T19:40:00Z"),
      evento("venta.aplicada", "2026-08-13T17:03:00Z"),
      evento("venta.cancelada", "2026-08-15T09:00:00Z"),
    ]);

    expect(hitos.map((h) => h.clave)).toEqual([
      "capturada",
      "aprobada",
      "aplicada",
      "cancelada",
    ]);
  });
});
