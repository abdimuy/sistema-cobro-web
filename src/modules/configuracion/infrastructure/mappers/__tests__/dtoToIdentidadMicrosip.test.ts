import { describe, it, expect } from "vitest";
import { dtoToIdentidadMicrosip } from "../dtoToIdentidadMicrosip";
import type { IdentidadMicrosipDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<IdentidadMicrosipDTO> = {}): IdentidadMicrosipDTO {
  return {
    nombre: "CARLOS RAMOS LUNA",
    v1_lista_id: 201,
    v2_lista_id: 202,
    v3_lista_id: 203,
    match_count: 3,
    ...overrides,
  };
}

describe("dtoToIdentidadMicrosip", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const dto = buildValidDTO();
    const identidad = dtoToIdentidadMicrosip(dto);

    expect(identidad.nombre).toBe("CARLOS RAMOS LUNA");
    expect(identidad.v1ListaId).toBe(201);
    expect(identidad.v2ListaId).toBe(202);
    expect(identidad.v3ListaId).toBe(203);
    expect(identidad.matchCount).toBe(3);
  });

  it("lista ids null se mapean a null", () => {
    const dto = buildValidDTO({ v1_lista_id: null, v2_lista_id: null, v3_lista_id: 203, match_count: 1 });
    const identidad = dtoToIdentidadMicrosip(dto);

    expect(identidad.v1ListaId).toBeNull();
    expect(identidad.v2ListaId).toBeNull();
    expect(identidad.v3ListaId).toBe(203);
    expect(identidad.matchCount).toBe(1);
  });

  it("lanza DomainError con code identidad_nombre_requerido si nombre está vacío", () => {
    const dto = buildValidDTO({ nombre: "" });
    expect(() => dtoToIdentidadMicrosip(dto)).toThrowError(
      expect.objectContaining({ code: "identidad_nombre_requerido" }),
    );
  });

  it("lanza DomainError con code identidad_match_count_invalido si match_count no es número", () => {
    const dto = buildValidDTO({ match_count: "tres" as unknown as number });
    expect(() => dtoToIdentidadMicrosip(dto)).toThrowError(
      expect.objectContaining({ code: "identidad_match_count_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ nombre: "" });
    expect(() => dtoToIdentidadMicrosip(dto)).toThrow(DomainError);
  });
});
