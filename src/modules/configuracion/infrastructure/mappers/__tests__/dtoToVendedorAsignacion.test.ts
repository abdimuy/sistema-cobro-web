import { describe, it, expect } from "vitest";
import { dtoToVendedorAsignacion } from "../dtoToVendedorAsignacion";
import type { VendedorAsignacionDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<VendedorAsignacionDTO> = {}): VendedorAsignacionDTO {
  return {
    usuario_id: "uid-brenda",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    email: "brenda.sanchez@muebleriamsp.mx",
    mapping: {
      v1: { lista_id: 101, nombre: "BRENDA SANCHEZ" },
      v2: { lista_id: 102, nombre: "BRENDA SANCHEZ" },
      v3: { lista_id: 103, nombre: "BRENDA SANCHEZ" },
    },
    estado: "3/3",
    ...overrides,
  };
}

describe("dtoToVendedorAsignacion", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const dto = buildValidDTO();
    const asignacion = dtoToVendedorAsignacion(dto);

    expect(asignacion.usuarioId).toBe("uid-brenda");
    expect(asignacion.nombre).toBe("BRENDA GUADALUPE SÁNCHEZ RUIZ");
    expect(asignacion.email).toBe("brenda.sanchez@muebleriamsp.mx");
    expect(asignacion.estado).toBe("3/3");
    expect(asignacion.mapping.v1).toEqual({ listaId: 101, nombre: "BRENDA SANCHEZ" });
    expect(asignacion.mapping.v2).toEqual({ listaId: 102, nombre: "BRENDA SANCHEZ" });
    expect(asignacion.mapping.v3).toEqual({ listaId: 103, nombre: "BRENDA SANCHEZ" });
  });

  it("slots null se mapean a null (sin asignar)", () => {
    const dto = buildValidDTO({
      mapping: { v1: null, v2: null, v3: null },
      estado: "sin asignar",
    });
    const asignacion = dtoToVendedorAsignacion(dto);

    expect(asignacion.mapping.v1).toBeNull();
    expect(asignacion.mapping.v2).toBeNull();
    expect(asignacion.mapping.v3).toBeNull();
    expect(asignacion.estado).toBe("sin asignar");
  });

  it("mapea estado parcial (2/3) tal cual (passthrough)", () => {
    const dto = buildValidDTO({
      mapping: {
        v1: { lista_id: 101, nombre: "BRENDA SANCHEZ" },
        v2: { lista_id: 102, nombre: "BRENDA SANCHEZ" },
        v3: null,
      },
      estado: "2/3",
    });
    const asignacion = dtoToVendedorAsignacion(dto);

    expect(asignacion.estado).toBe("2/3");
    expect(asignacion.mapping.v3).toBeNull();
  });

  it("lanza DomainError con code usuario_id_requerido si usuario_id está vacío", () => {
    const dto = buildValidDTO({ usuario_id: "" });
    expect(() => dtoToVendedorAsignacion(dto)).toThrowError(
      expect.objectContaining({ code: "usuario_id_requerido" }),
    );
  });

  it("lanza DomainError con code vendedor_slot_lista_id_invalido si un slot trae lista_id no numérico", () => {
    const dto = buildValidDTO({
      mapping: {
        v1: { lista_id: "abc" as unknown as number, nombre: "X" },
        v2: null,
        v3: null,
      },
    });
    expect(() => dtoToVendedorAsignacion(dto)).toThrowError(
      expect.objectContaining({ code: "vendedor_slot_lista_id_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ usuario_id: "" });
    expect(() => dtoToVendedorAsignacion(dto)).toThrow(DomainError);
  });
});
