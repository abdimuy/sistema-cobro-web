import { describe, expect, it } from "vitest";
import { codigoDeError } from "../codigoDeError";
import { CUERPO_422_ARTICULO, CUERPO_422_ZONA } from "./cuerposVentas422";

describe("codigoDeError", () => {
  it("Huma (cuerpo real de mapAppError): lee code= de errors[]", () => {
    expect(codigoDeError(CUERPO_422_ZONA)).toBe("venta_zona_no_coincide_cliente");
  });

  it("Huma con la línea rechazada después: sigue tomando el code=", () => {
    expect(codigoDeError(CUERPO_422_ARTICULO)).toBe("precio_anual_credito_requerido");
  });

  it("chi + Problem: `code` de primer nivel; errors[] por campo no estorba", () => {
    expect(
      codigoDeError({
        title: "Unprocessable Entity",
        status: 422,
        code: "validation_failed",
        errors: [{ field: "email", code: "required", message: "es obligatorio" }],
      }),
    ).toBe("validation_failed");
  });

  it("si vienen los dos, gana code= de errors[]", () => {
    expect(codigoDeError({ code: "otro", errors: [{ message: "code=el_bueno" }] })).toBe("el_bueno");
  });

  it("forma vieja 'codigo: mensaje' como último recurso", () => {
    expect(codigoDeError({ errors: [{ message: "cliente_no_encontrado: no existe" }] })).toBe("cliente_no_encontrado");
  });

  it("code= inválido no se acepta", () => {
    expect(codigoDeError({ errors: [{ message: "code=Con Espacios" }] })).toBeNull();
  });

  it.each([null, undefined, "texto", 3, {}, { errors: "x" }, { code: "" }])("sin código %#: null", (c) => {
    expect(codigoDeError(c)).toBeNull();
  });
});
