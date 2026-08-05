import { describe, it, expect } from "vitest";
import { apperrorToDomainError } from "../errorMapper";
import { DomainError } from "../../../domain/errors";

// Mirrors the REAL msp-api response shape (huma.ErrorModel), as produced by
// internal/config/infra/confighttp/auth.go mapAppError:
//   huma.NewError(status, ae.Message, &huma.ErrorDetail{Message: "code=" + ae.Code})
// which Huma serializes as:
//   { title: <generic http.StatusText>, status, detail: <ae.Message, Spanish>,
//     errors: [ { message: "code=<ae.Code>" } ] }
// There is NEVER a top-level `code` or `message` field.
function makeHumaAxiosError(status: number, detail: string, code: string) {
  return Object.assign(new Error("Request failed"), {
    isAxiosError: true,
    response: {
      status,
      data: {
        title: statusText(status),
        status,
        detail,
        errors: [{ message: `code=${code}` }],
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

  it("mapea forbidden a un mensaje amigable", () => {
    const err = makeHumaAxiosError(403, "permiso denegado", "forbidden");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("forbidden");
    expect(domainError.message).toBe(
      "no tienes permisos para administrar usuarios y roles",
    );
  });

  it("mapea rol_not_found a un mensaje amigable", () => {
    const err = makeHumaAxiosError(404, "rol no encontrado", "rol_not_found");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_not_found");
    expect(domainError.message).toBe("el rol ya no existe");
  });

  it("mapea rol_inmutable a un mensaje amigable", () => {
    const err = makeHumaAxiosError(
      403,
      "no se puede modificar un rol inmutable",
      "rol_inmutable",
    );
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_inmutable");
    expect(domainError.message).toBe("no se puede modificar un rol inmutable");
  });

  it("mapea rol_ya_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(409, "ya existe un rol con ese nombre", "rol_ya_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("rol_ya_existe");
    expect(domainError.message).toBe("ya existe un rol con ese nombre");
  });

  it("mapea usuario_not_found a un mensaje amigable", () => {
    const err = makeHumaAxiosError(404, "usuario no encontrado", "usuario_not_found");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("usuario_not_found");
    expect(domainError.message).toBe("el usuario ya no existe");
  });

  it("mapea permiso_not_found a un mensaje amigable", () => {
    const err = makeHumaAxiosError(404, "permiso no encontrado", "permiso_not_found");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("permiso_not_found");
    expect(domainError.message).toBe("el permiso ya no existe");
  });

  it("usa el detail del backend cuando el code no tiene traducción amigable", () => {
    const err = makeHumaAxiosError(500, "fallo interno inesperado", "error_inesperado");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("error_inesperado");
    expect(domainError.message).toBe("fallo interno inesperado");
  });

  it("cae al status HTTP cuando la respuesta no trae errors[] (forma inesperada)", () => {
    const err = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 500,
        data: { title: "Internal Server Error", status: 500, detail: "algo salió mal" },
      },
    });
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("http_500");
    expect(domainError.message).toBe("algo salió mal");
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
