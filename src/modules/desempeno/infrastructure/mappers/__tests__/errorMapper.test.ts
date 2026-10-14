import { describe, expect, it } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { apperrorToDomainError, normalizarErrorBlob } from "../errorMapper";

function errorHttp(status: number, data: unknown): AxiosError {
  return new AxiosError("falla", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as AxiosResponse["config"],
  } as AxiosResponse);
}

describe("apperrorToDomainError", () => {
  it("lee el código del formato Huma de msp-api (errors[].message = 'code=...')", () => {
    const e = apperrorToDomainError(
      errorHttp(409, {
        title: "Conflict",
        status: 409,
        detail: "el usuario no tiene zona asignada",
        errors: [{ message: "code=desempeno_usuario_sin_zona" }],
      }),
    );
    expect(e.code).toBe("desempeno_usuario_sin_zona");
    expect(e.message).toBe("el usuario no tiene zona asignada");
  });

  it("también acepta `code` plano (Problem Details)", () => {
    expect(apperrorToDomainError(errorHttp(422, { code: "desempeno_parametro_invalido", detail: "pausa_min fuera de rango" })).code).toBe(
      "desempeno_parametro_invalido",
    );
  });

  it("sin código reconocible cae a http_<status>", () => {
    expect(apperrorToDomainError(errorHttp(500, { title: "Internal Server Error" })).code).toBe("http_500");
  });

  it("sin respuesta = error de red", () => {
    const e = apperrorToDomainError(new AxiosError("Network Error", "ERR_NETWORK"));
    expect(e.code).toBe("network_error");
  });
});

describe("normalizarErrorBlob", () => {
  it("convierte un cuerpo Blob con JSON en objeto para poder leer el código", async () => {
    const blob = new Blob([JSON.stringify({ detail: "no existe la foto", errors: [{ message: "code=not_found" }] })], {
      type: "application/json",
    });
    const e = apperrorToDomainError(await normalizarErrorBlob(errorHttp(404, blob)));
    expect(e.code).toBe("not_found");
    expect(e.message).toBe("no existe la foto");
  });
});
