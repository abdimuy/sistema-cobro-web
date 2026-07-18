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
    422: "Unprocessable Entity",
    500: "Internal Server Error",
  };
  return map[status] ?? "Error";
}

describe("apperrorToDomainError (configuracion)", () => {
  it("pasa a través un DomainError ya existente", () => {
    const original = new DomainError("ya_mapeado", "mensaje original");
    expect(apperrorToDomainError(original)).toBe(original);
  });

  it("mapea forbidden (real forma Huma: errors[].message = code=forbidden) a un mensaje amigable", () => {
    const err = makeHumaAxiosError(403, "permiso denegado", "forbidden");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("forbidden");
    expect(domainError.message).toBe(
      "no tienes permisos para administrar vendedores; solicita acceso al administrador",
    );
  });

  it("mapea vendedor_lista_id_no_pertenece a un mensaje amigable", () => {
    const err = makeHumaAxiosError(
      422,
      "el vendedor no pertenece a la lista",
      "vendedor_lista_id_no_pertenece",
    );
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("vendedor_lista_id_no_pertenece");
    expect(domainError.message).toBe(
      "el identificador de vendedor seleccionado no existe en Microsip",
    );
  });

  it("mapea usuario_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(404, "el usuario no existe", "usuario_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("usuario_no_existe");
    expect(domainError.message).toBe("el usuario ya no existe");
  });

  it("mapea zona_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "la zona no existe", "zona_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("zona_no_existe");
    expect(domainError.message).toBe("la zona seleccionada ya no existe");
  });

  it("mapea caja_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "la caja no existe", "caja_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("caja_no_existe");
    expect(domainError.message).toBe("la caja seleccionada no existe en Microsip");
  });

  it("mapea cajero_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "el cajero no existe", "cajero_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("cajero_no_existe");
    expect(domainError.message).toBe("el cajero seleccionado no existe en Microsip");
  });

  it("mapea vendedor_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "el vendedor no existe", "vendedor_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("vendedor_no_existe");
    expect(domainError.message).toBe("el vendedor seleccionado no existe en Microsip");
  });

  it("mapea cobrador_no_existe a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "el cobrador no existe", "cobrador_no_existe");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("cobrador_no_existe");
    expect(domainError.message).toBe("el cobrador seleccionado no existe en Microsip");
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
});
