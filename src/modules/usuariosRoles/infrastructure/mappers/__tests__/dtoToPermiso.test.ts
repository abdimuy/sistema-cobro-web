import { describe, it, expect } from "vitest";
import { dtoToPermiso } from "../dtoToPermiso";
import type { PermisoResponseDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<PermisoResponseDTO> = {}): PermisoResponseDTO {
  return {
    codigo: "usuarios:ver",
    description: "ver el directorio de usuarios",
    categoria: "usuarios",
    ...overrides,
  };
}

describe("dtoToPermiso", () => {
  it("happy path: mapea todos los campos correctamente, incluyendo el ':' en codigo", () => {
    const permiso = dtoToPermiso(buildValidDTO());

    expect(permiso).toEqual({
      codigo: "usuarios:ver",
      description: "ver el directorio de usuarios",
      categoria: "usuarios",
    });
  });

  it("lanza DomainError malformed_response si codigo está vacío", () => {
    expect(() => dtoToPermiso(buildValidDTO({ codigo: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si description no es string", () => {
    const dto = buildValidDTO({ description: null as unknown as string });
    expect(() => dtoToPermiso(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si categoria está vacía", () => {
    expect(() => dtoToPermiso(buildValidDTO({ categoria: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("DomainError hereda de Error", () => {
    expect(() => dtoToPermiso(buildValidDTO({ codigo: "" }))).toThrow(DomainError);
  });
});
