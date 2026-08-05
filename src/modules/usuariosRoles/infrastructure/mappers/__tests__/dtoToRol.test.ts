import { describe, it, expect } from "vitest";
import { dtoToRol } from "../dtoToRol";
import type { RolResponseDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<RolResponseDTO> = {}): RolResponseDTO {
  return {
    id: "rol-supervisor",
    nombre: "supervisor",
    description: "supervisa cobranza y ventas de su zona",
    inmutable: false,
    activo: true,
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

describe("dtoToRol", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const rol = dtoToRol(buildValidDTO());

    expect(rol).toEqual({
      id: "rol-supervisor",
      nombre: "supervisor",
      description: "supervisa cobranza y ventas de su zona",
      inmutable: false,
      activo: true,
    });
  });

  it("description undefined se mapea a null", () => {
    const dto = buildValidDTO();
    delete dto.description;
    const rol = dtoToRol(dto);
    expect(rol.description).toBeNull();
  });

  it("description null explícito se mapea a null", () => {
    const rol = dtoToRol(buildValidDTO({ description: null }));
    expect(rol.description).toBeNull();
  });

  it("mapea inmutable: true tal cual (rol de sistema)", () => {
    const rol = dtoToRol(buildValidDTO({ nombre: "super_admin", inmutable: true }));
    expect(rol.inmutable).toBe(true);
  });

  it("lanza DomainError malformed_response si id está vacío", () => {
    expect(() => dtoToRol(buildValidDTO({ id: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si nombre está vacío", () => {
    expect(() => dtoToRol(buildValidDTO({ nombre: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si inmutable no es boolean", () => {
    const dto = buildValidDTO({ inmutable: "false" as unknown as boolean });
    expect(() => dtoToRol(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si activo no es boolean", () => {
    const dto = buildValidDTO({ activo: 1 as unknown as boolean });
    expect(() => dtoToRol(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("DomainError hereda de Error", () => {
    expect(() => dtoToRol(buildValidDTO({ id: "" }))).toThrow(DomainError);
  });
});
