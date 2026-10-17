import { describe, it, expect } from "vitest";
import { dtoToZonaExcluidaDesempeno } from "../dtoToZonaExcluidaDesempeno";
import { DomainError } from "../../../domain/errors";

describe("dtoToZonaExcluidaDesempeno", () => {
  it("mapea los tres campos del DTO", () => {
    const z = dtoToZonaExcluidaDesempeno({
      zona_id: 23301,
      zona_nombre: "MAYOREO",
      created_at: "2026-10-01T18:00:00Z",
    });
    expect(z).toEqual({ zonaId: 23301, zonaNombre: "MAYOREO", createdAt: "2026-10-01T18:00:00Z" });
  });

  it("rechaza un zona_id que no es número", () => {
    expect(() =>
      dtoToZonaExcluidaDesempeno({
        zona_id: "x" as unknown as number,
        zona_nombre: "MAYOREO",
        created_at: "2026-10-01T18:00:00Z",
      }),
    ).toThrow(DomainError);
  });

  it("nombre ausente queda como cadena vacía", () => {
    const z = dtoToZonaExcluidaDesempeno({
      zona_id: 1,
      zona_nombre: undefined as unknown as string,
      created_at: "2026-10-01T18:00:00Z",
    });
    expect(z.zonaNombre).toBe("");
  });
});
