import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { apperrorToDomainError } from "./apperrorToDomainError";
import { DomainError } from "../../domain/errors";

function makeAxiosError(status: number, data: unknown): AxiosError {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe("apperrorToDomainError", () => {
  it("maps failed_intent_not_found to a friendly Spanish message", () => {
    const e = apperrorToDomainError(
      makeAxiosError(404, {
        code: "failed_intent_not_found",
        message: "no encontrado",
      }),
    );
    expect(e).toBeInstanceOf(DomainError);
    expect(e.code).toBe("failed_intent_not_found");
    expect(e.message).toBe("este intento ya no existe");
  });

  it("maps blob_intent_replay_with_unsupported", () => {
    const e = apperrorToDomainError(
      makeAxiosError(422, { code: "blob_intent_replay_with_unsupported" }),
    );
    expect(e.code).toBe("blob_intent_replay_with_unsupported");
    expect(e.message).toMatch(/imágenes/);
  });

  it("maps failed_intent_status_conflict", () => {
    const e = apperrorToDomainError(
      makeAxiosError(409, {
        code: "failed_intent_status_conflict",
        message: "el estado del intento no coincide",
      }),
    );
    expect(e.code).toBe("failed_intent_status_conflict");
    expect(e.message).toMatch(/otro usuario/);
  });

  it("falls through to the backend message for unknown codes", () => {
    const e = apperrorToDomainError(
      makeAxiosError(422, { code: "validation_error", message: "campo inválido" }),
    );
    expect(e.code).toBe("validation_error");
    expect(e.message).toBe("campo inválido");
  });

  it("falls back to http_<status> when no code is present", () => {
    const e = apperrorToDomainError(makeAxiosError(500, {}));
    expect(e.code).toBe("http_500");
  });

  it("passes through DomainError instances unchanged", () => {
    const e = new DomainError("blob_intent_replay_with_unsupported", "msg");
    expect(apperrorToDomainError(e)).toBe(e);
  });

  it("wraps native Error in error_inesperado", () => {
    const e = apperrorToDomainError(new Error("boom"));
    expect(e.code).toBe("error_inesperado");
    expect(e.message).toBe("boom");
  });

  it("maps Huma-style errors (errors[].message = 'code: msg')", () => {
    const e = apperrorToDomainError(
      makeAxiosError(422, {
        title: "Unprocessable Entity",
        errors: [{ message: "intent_has_no_usuario: vendedor faltante" }],
      }),
    );
    expect(e.code).toBe("intent_has_no_usuario");
  });
});
