import { describe, expect, it } from "vitest";
import { errorMessage } from "./useVentaActions";

describe("errorMessage", () => {
  it("returns the custom message for venta_zona_no_coincide_cliente", () => {
    const err = {
      response: {
        data: { code: "venta_zona_no_coincide_cliente", detail: "la zona no coincide" },
      },
    };
    expect(errorMessage(err)).toBe(
      "La zona de la venta no coincide con la del cliente. Corrígela antes de aplicar."
    );
  });

  it("returns detail for other error codes", () => {
    const err = {
      response: { data: { code: "some_other_code", detail: "otro error del servidor" } },
    };
    expect(errorMessage(err)).toBe("otro error del servidor");
  });

  it("falls back to title when detail is absent", () => {
    const err = {
      response: { data: { title: "Validation Error" } },
    };
    expect(errorMessage(err)).toBe("Validation Error");
  });

  it("returns the final fallback when neither detail nor title is present", () => {
    const err = { response: { data: {} } };
    expect(errorMessage(err)).toBe("Error inesperado del servidor");
  });

  it("handles a native Error instance", () => {
    expect(errorMessage(new Error("fallo de red"))).toBe("fallo de red");
  });

  it("handles non-Error, non-response unknowns", () => {
    expect(errorMessage("string error")).toBe("Error inesperado");
    expect(errorMessage(42)).toBe("Error inesperado");
  });
});
