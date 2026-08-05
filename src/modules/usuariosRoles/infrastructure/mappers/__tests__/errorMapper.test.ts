import { describe, it, expect } from "vitest";
import { apperrorToDomainError } from "../errorMapper";
import { DomainError } from "../../../domain/errors";

// Mirrors the REAL msp-api response shape for internal/auth (chi +
// internal/platform/response — NOT Huma): a flat RFC 9457 Problem Details
// document with top-level `code`/`detail`, per
// internal/platform/response/response.go `Problem`:
//   { type, title, status, detail?, instance?, code?, request_id?, errors?, fields? }
// There is NO nested `errors[].message` "code=<x>" envelope and NO
// top-level `message` field.
function makeAxiosError(status: number, code: string, detail: string) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: {
      status,
      data: {
        type: "about:blank",
        title: statusText(status),
        status,
        detail,
        code,
      },
    },
  });
}

function statusText(status: number): string {
  const map: Record<number, string> = {
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
  };
  return map[status] ?? "Error";
}

describe("apperrorToDomainError (usuariosRoles)", () => {
  it("pasa a través un DomainError ya existente", () => {
    const original = new DomainError("ya_mapeado", "mensaje original");
    expect(apperrorToDomainError(original)).toBe(original);
  });

  it("mapea permission_denied (código real de authz.go) a un mensaje amigable — regresión Problem plano", () => {
    const err = makeAxiosError(403, "permission_denied", "permiso denegado");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("permission_denied");
    expect(domainError.message).toBe(
      "no tienes permisos para administrar usuarios y roles",
    );
  });

  it("mapea rol_not_found a un mensaje amigable", () => {
    const err = makeAxiosError(404, "rol_not_found", "rol no encontrado");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_not_found");
    expect(domainError.message).toBe("el rol ya no existe");
  });

  it("mapea rol_inmutable a un mensaje amigable", () => {
    const err = makeAxiosError(403, "rol_inmutable", "no se puede modificar un rol inmutable");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_inmutable");
    expect(domainError.message).toBe("no se puede modificar un rol inmutable");
  });

  it("mapea rol_ya_existe a un mensaje amigable", () => {
    const err = makeAxiosError(409, "rol_ya_existe", "ya existe un rol con ese nombre");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_ya_existe");
    expect(domainError.message).toBe("ya existe un rol con ese nombre");
  });

  it("mapea usuario_not_found a un mensaje amigable", () => {
    const err = makeAxiosError(404, "usuario_not_found", "usuario no encontrado");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("usuario_not_found");
    expect(domainError.message).toBe("el usuario ya no existe");
  });

  it("mapea permiso_not_found a un mensaje amigable", () => {
    const err = makeAxiosError(404, "permiso_not_found", "permiso no encontrado");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("permiso_not_found");
    expect(domainError.message).toBe("el permiso ya no existe");
  });

  it("usa el detail del backend cuando el code no tiene traducción amigable", () => {
    const err = makeAxiosError(500, "internal_error", "ocurrió un error interno");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("internal_error");
    expect(domainError.message).toBe("ocurrió un error interno");
  });

  it("cae al title cuando la respuesta no trae detail", () => {
    const err = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 500,
        data: { type: "about:blank", title: "Internal Server Error", status: 500 },
      },
    });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("http_500");
    expect(domainError.message).toBe("Internal Server Error");
  });

  it("envuelve un Error genérico como error_inesperado", () => {
    const domainError = apperrorToDomainError(new Error("algo falló"));
    expect(domainError.code).toBe("error_inesperado");
    expect(domainError.message).toBe("algo falló");
  });

  it("envuelve un valor no-Error como error_inesperado", () => {
    const domainError = apperrorToDomainError("algo raro");
    expect(domainError.code).toBe("error_inesperado");
    expect(domainError.message).toBe("algo raro");
  });
});
