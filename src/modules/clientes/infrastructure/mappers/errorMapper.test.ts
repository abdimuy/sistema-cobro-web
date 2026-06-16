import { describe, it, expect } from "vitest";
import axios from "axios";
import { apperrorToDomainError } from "./errorMapper";
import { DomainError } from "../../domain/errors";

function makeAxiosError(
  status: number,
  data: Record<string, unknown>,
): ReturnType<typeof axios.isAxiosError> extends true ? unknown : unknown {
  const err = new axios.AxiosError("Request failed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (err as any).response = { status, data };
  return err;
}

describe("apperrorToDomainError", () => {
  it("passes through an existing DomainError unchanged", () => {
    const original = new DomainError("mi_codigo", "ya es un error de dominio");
    const result = apperrorToDomainError(original);
    expect(result).toBe(original);
  });

  it("maps an AxiosError with a backend code field", () => {
    const err = makeAxiosError(422, {
      code: "cliente_no_encontrado",
      message: "el cliente no existe",
    });
    const result = apperrorToDomainError(err);
    expect(result).toBeInstanceOf(DomainError);
    expect(result.code).toBe("cliente_no_encontrado");
    expect(result.message).toBe("el cliente no existe");
  });

  it("applies the friendly message for the forbidden code", () => {
    const err = makeAxiosError(403, { code: "forbidden", message: "access denied" });
    const result = apperrorToDomainError(err);
    expect(result.code).toBe("forbidden");
    expect(result.message).toContain("no tienes permisos");
  });

  it("extracts code from a Huma validation errors array", () => {
    const err = makeAxiosError(422, {
      errors: [{ message: "segmento_invalido: el valor DESCONOCIDO no es válido" }],
    });
    const result = apperrorToDomainError(err);
    expect(result.code).toBe("segmento_invalido");
  });

  it("falls back to http_{status} code when no code field", () => {
    const err = makeAxiosError(500, { message: "error interno del servidor" });
    const result = apperrorToDomainError(err);
    expect(result.code).toBe("http_500");
    expect(result.message).toBe("error interno del servidor");
  });

  it("maps a generic Error to error_inesperado", () => {
    const err = new Error("algo salió mal");
    const result = apperrorToDomainError(err);
    expect(result.code).toBe("error_inesperado");
    expect(result.message).toBe("algo salió mal");
  });

  it("maps an unknown thrown value to error_inesperado", () => {
    const result = apperrorToDomainError("cadena inesperada");
    expect(result.code).toBe("error_inesperado");
  });
});
