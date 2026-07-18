import { describe, it, expect } from "vitest";
import { dtoToZonaCajaAsignacion } from "../dtoToZonaCajaAsignacion";
import type { ZonaCajaAsignacionDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<ZonaCajaAsignacionDTO> = {}): ZonaCajaAsignacionDTO {
  return {
    zona_cliente_id: 12,
    zona_nombre: "ZONA CENTRO — MORELIA",
    caja: { id: 501, nombre: "CAJA1" },
    cajero: { id: 601, nombre: "PATRICIA ELIZONDO VARGAS" },
    vendedor: { id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" },
    cobrador: { id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" },
    ...overrides,
  };
}

describe("dtoToZonaCajaAsignacion", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const dto = buildValidDTO();
    const asignacion = dtoToZonaCajaAsignacion(dto);

    expect(asignacion.zonaClienteId).toBe(12);
    expect(asignacion.zonaNombre).toBe("ZONA CENTRO — MORELIA");
    expect(asignacion.caja).toEqual({ id: 501, nombre: "CAJA1" });
    expect(asignacion.cajero).toEqual({ id: 601, nombre: "PATRICIA ELIZONDO VARGAS" });
    expect(asignacion.vendedor).toEqual({ id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" });
    expect(asignacion.cobrador).toEqual({ id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" });
  });

  it("refs null se mapean a null (sin asignar)", () => {
    const dto = buildValidDTO({ caja: null, cajero: null, vendedor: null, cobrador: null });
    const asignacion = dtoToZonaCajaAsignacion(dto);

    expect(asignacion.caja).toBeNull();
    expect(asignacion.cajero).toBeNull();
    expect(asignacion.vendedor).toBeNull();
    expect(asignacion.cobrador).toBeNull();
  });

  it("mapea una zona con solo algunos slots asignados (passthrough parcial)", () => {
    const dto = buildValidDTO({ cajero: null, cobrador: null });
    const asignacion = dtoToZonaCajaAsignacion(dto);

    expect(asignacion.caja).not.toBeNull();
    expect(asignacion.cajero).toBeNull();
    expect(asignacion.vendedor).not.toBeNull();
    expect(asignacion.cobrador).toBeNull();
  });

  it("lanza DomainError con code zona_cliente_id_invalido si zona_cliente_id no es numérico", () => {
    const dto = buildValidDTO({ zona_cliente_id: "abc" as unknown as number });
    expect(() => dtoToZonaCajaAsignacion(dto)).toThrowError(
      expect.objectContaining({ code: "zona_cliente_id_invalido" }),
    );
  });

  it("lanza DomainError con code zona_caja_ref_id_invalido si un ref trae id no numérico", () => {
    const dto = buildValidDTO({
      caja: { id: "x" as unknown as number, nombre: "CAJA1" },
    });
    expect(() => dtoToZonaCajaAsignacion(dto)).toThrowError(
      expect.objectContaining({ code: "zona_caja_ref_id_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ zona_cliente_id: "abc" as unknown as number });
    expect(() => dtoToZonaCajaAsignacion(dto)).toThrow(DomainError);
  });
});
