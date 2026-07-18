import { describe, it, expect } from "vitest";
import { dtoToOpcionesZonasCajas } from "../dtoToOpcionesZonasCajas";
import type { OpcionesZonasCajasDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<OpcionesZonasCajasDTO> = {}): OpcionesZonasCajasDTO {
  return {
    zonas: [{ id: 12, nombre: "ZONA CENTRO — MORELIA" }],
    cajas: [{ id: 501, nombre: "CAJA1" }],
    cajeros: [{ id: 601, nombre: "PATRICIA ELIZONDO VARGAS" }],
    vendedores: [{ id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" }],
    cobradores: [{ id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" }],
    ...overrides,
  };
}

describe("dtoToOpcionesZonasCajas", () => {
  it("happy path: mapea los 5 catálogos correctamente", () => {
    const dto = buildValidDTO();
    const opciones = dtoToOpcionesZonasCajas(dto);

    expect(opciones.zonas).toEqual([{ id: 12, nombre: "ZONA CENTRO — MORELIA" }]);
    expect(opciones.cajas).toEqual([{ id: 501, nombre: "CAJA1" }]);
    expect(opciones.cajeros).toEqual([{ id: 601, nombre: "PATRICIA ELIZONDO VARGAS" }]);
    expect(opciones.vendedores).toEqual([{ id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" }]);
    expect(opciones.cobradores).toEqual([{ id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" }]);
  });

  it("catálogos vacíos se mapean a listas vacías", () => {
    const dto = buildValidDTO({ cajas: [], cajeros: [] });
    const opciones = dtoToOpcionesZonasCajas(dto);

    expect(opciones.cajas).toEqual([]);
    expect(opciones.cajeros).toEqual([]);
  });

  it("lanza DomainError si un catálogo no es una lista", () => {
    const dto = buildValidDTO({ cajas: undefined as unknown as OpcionesZonasCajasDTO["cajas"] });
    expect(() => dtoToOpcionesZonasCajas(dto)).toThrowError(
      expect.objectContaining({ code: "opciones_zonas_cajas_catalogo_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ cajas: undefined as unknown as OpcionesZonasCajasDTO["cajas"] });
    expect(() => dtoToOpcionesZonasCajas(dto)).toThrow(DomainError);
  });
});
