import { describe, it, expect } from "vitest";
import { dtoToUsuario } from "../dtoToUsuario";
import type { UsuarioResponseDTO } from "../../http/dtos";

function makeDTO(overrides: Partial<UsuarioResponseDTO> = {}): UsuarioResponseDTO {
  return {
    id: "usr-brenda",
    firebase_uid: "fbuid-brenda",
    email: "brenda.sanchez@muebleriamsp.mx",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    telefono: "4431122334",
    almacen_id: 11058,
    activo: true,
    created_at: "2026-08-27T12:00:00Z",
    updated_at: "2026-08-27T12:00:00Z",
    ...overrides,
  };
}

describe("dtoToUsuario", () => {
  it("mapea el DTO completo a la entidad", () => {
    expect(dtoToUsuario(makeDTO())).toEqual({
      id: "usr-brenda",
      firebaseUid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      telefono: "4431122334",
      almacenId: 11058,
      activo: true,
    });
  });

  it("normaliza telefono y almacen_id ausentes o null a null", () => {
    const sinOpcionales = dtoToUsuario(
      makeDTO({ telefono: null, almacen_id: undefined }),
    );
    expect(sinOpcionales.telefono).toBeNull();
    expect(sinOpcionales.almacenId).toBeNull();
  });

  it.each([
    ["id vacío", { id: "" }],
    ["sin firebase_uid", { firebase_uid: undefined }],
    ["firebase_uid vacío", { firebase_uid: "" }],
    ["email vacío", { email: "" }],
    ["nombre vacío", { nombre: "" }],
    ["activo con tipo equivocado", { activo: "sí" as unknown as boolean }],
    ["telefono con tipo equivocado", { telefono: 443 as unknown as string }],
    ["almacen_id con tipo equivocado", { almacen_id: "11058" as unknown as number }],
  ])("lanza malformed_response con %s", (_caso, overrides) => {
    expect(() => dtoToUsuario(makeDTO(overrides))).toThrowError(
      expect.objectContaining({ code: "malformed_response" }),
    );
  });
});
