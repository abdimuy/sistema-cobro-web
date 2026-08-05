import { describe, it, expect } from "vitest";
import { dtoToUsuario } from "../dtoToUsuario";
import type { UsuarioResponseDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<UsuarioResponseDTO> = {}): UsuarioResponseDTO {
  return {
    id: "usr-brenda",
    firebase_uid: "fbuid-brenda",
    email: "brenda.sanchez@muebleriamsp.mx",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    activo: true,
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

describe("dtoToUsuario", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const usuario = dtoToUsuario(buildValidDTO());

    expect(usuario).toEqual({
      id: "usr-brenda",
      firebaseUid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      activo: true,
    });
  });

  it("mapea activo: false tal cual", () => {
    const usuario = dtoToUsuario(buildValidDTO({ activo: false }));
    expect(usuario.activo).toBe(false);
  });

  it("lanza DomainError malformed_response si id está vacío", () => {
    expect(() => dtoToUsuario(buildValidDTO({ id: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si firebase_uid falta", () => {
    const dto = buildValidDTO();
    // @ts-expect-error simulating a malformed backend response
    delete dto.firebase_uid;
    expect(() => dtoToUsuario(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si email no es string", () => {
    const dto = buildValidDTO({ email: null as unknown as string });
    expect(() => dtoToUsuario(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si activo no es boolean", () => {
    const dto = buildValidDTO({ activo: "true" as unknown as boolean });
    expect(() => dtoToUsuario(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si nombre está vacío (consistente con dtoToRol)", () => {
    expect(() => dtoToUsuario(buildValidDTO({ nombre: "" }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si nombre es solo espacios", () => {
    expect(() => dtoToUsuario(buildValidDTO({ nombre: "   " }))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("lanza DomainError malformed_response si nombre no es string", () => {
    const dto = buildValidDTO({ nombre: null as unknown as string });
    expect(() => dtoToUsuario(dto)).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });

  it("DomainError hereda de Error", () => {
    expect(() => dtoToUsuario(buildValidDTO({ id: "" }))).toThrow(DomainError);
  });
});
