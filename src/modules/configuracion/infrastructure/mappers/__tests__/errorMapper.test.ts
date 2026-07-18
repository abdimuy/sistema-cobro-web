import { describe, it, expect } from "vitest";
import { apperrorToDomainError } from "../errorMapper";
import { DomainError } from "../../../domain/errors";

function makeAxiosError(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: { status, data },
  });
}

describe("apperrorToDomainError (configuracion)", () => {
  it("pasa a través un DomainError ya existente", () => {
    const original = new DomainError("ya_mapeado", "mensaje original");
    expect(apperrorToDomainError(original)).toBe(original);
  });

  it("mapea forbidden a un mensaje amigable en español", () => {
    const err = makeAxiosError(403, { code: "forbidden", message: "forbidden" });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("forbidden");
    expect(domainError.message).toBe(
      "no tienes permisos para administrar vendedores; solicita acceso al administrador",
    );
  });

  it("mapea vendedor_lista_id_no_pertenece a un mensaje amigable", () => {
    const err = makeAxiosError(422, {
      code: "vendedor_lista_id_no_pertenece",
      message: "no pertenece",
    });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("vendedor_lista_id_no_pertenece");
    expect(domainError.message).toBe(
      "el identificador de vendedor seleccionado no existe en Microsip",
    );
  });

  it("mapea usuario_no_existe a un mensaje amigable", () => {
    const err = makeAxiosError(404, { code: "usuario_no_existe", message: "no existe" });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("usuario_no_existe");
    expect(domainError.message).toBe("el usuario ya no existe");
  });

  it("usa el message del backend cuando el code no tiene traducción amigable", () => {
    const err = makeAxiosError(500, { code: "error_inesperado", message: "fallo interno" });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("error_inesperado");
    expect(domainError.message).toBe("fallo interno");
  });

  it("envuelve un Error genérico como error_inesperado", () => {
    const domainError = apperrorToDomainError(new Error("algo falló"));
    expect(domainError.code).toBe("error_inesperado");
    expect(domainError.message).toBe("algo falló");
  });
});
