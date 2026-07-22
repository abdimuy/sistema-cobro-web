import { describe, it, expect } from "vitest";
import { apperrorToDomainError } from "../errorMapper";
import { DomainError } from "../../../domain/errors";

// Mirrors the REAL msp-api response shape (huma.ErrorModel), as produced by
// the module's HTTP handlers via mapAppError:
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

describe("apperrorToDomainError (bandeja)", () => {
  it("pasa a través un DomainError ya existente", () => {
    const original = new DomainError("ya_mapeado", "mensaje original");
    expect(apperrorToDomainError(original)).toBe(original);
  });

  it("mapea forbidden a un mensaje amigable", () => {
    const err = makeHumaAxiosError(403, "permiso denegado", "forbidden");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("forbidden");
    expect(domainError.message).toBe(
      "no tienes permisos para ver la bandeja de reactivación; solicita acceso al administrador",
    );
  });

  it("mapea reactivacion_conversacion_no_encontrada a un mensaje amigable", () => {
    const err = makeHumaAxiosError(404, "no existe", "reactivacion_conversacion_no_encontrada");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_conversacion_no_encontrada");
    expect(domainError.message).toBe("la conversación no existe");
  });

  it("mapea reactivacion_no_hay_borrador_pendiente a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "no hay borrador", "reactivacion_no_hay_borrador_pendiente");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_no_hay_borrador_pendiente");
    expect(domainError.message).toBe("no hay un borrador pendiente para este cliente");
  });

  it("mapea reactivacion_cliente_sin_datos_contacto a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "sin contacto", "reactivacion_cliente_sin_datos_contacto");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_cliente_sin_datos_contacto");
    expect(domainError.message).toBe("el cliente no tiene datos de contacto");
  });

  it("mapea reactivacion_texto_editado_vacio a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "vacío", "reactivacion_texto_editado_vacio");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_texto_editado_vacio");
    expect(domainError.message).toBe("el texto editado no puede estar vacío");
  });

  it("mapea reactivacion_intencion_vacia a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "vacía", "reactivacion_intencion_vacia");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_intencion_vacia");
    expect(domainError.message).toBe("la intención dictada no puede estar vacía");
  });

  it("mapea reactivacion_mensaje_entrante_vacio a un mensaje amigable", () => {
    const err = makeHumaAxiosError(422, "vacío", "reactivacion_mensaje_entrante_vacio");
    const domainError = apperrorToDomainError(err);
    expect(domainError.code).toBe("reactivacion_mensaje_entrante_vacio");
    expect(domainError.message).toBe("el mensaje entrante no puede estar vacío");
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
