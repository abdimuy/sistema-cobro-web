import { describe, expect, it } from "vitest";
import { errorMessage } from "./useVentaActions";
import {
  CUERPO_422_ARTICULO,
  CUERPO_422_COMBO,
  CUERPO_422_SIN_LINEA,
  DETAIL_422,
} from "@/lib/__tests__/cuerposVentas422";

describe("errorMessage", () => {
  it("returns the custom message for venta_zona_no_coincide_cliente", () => {
    const err = {
      response: {
        data: { code: "venta_zona_no_coincide_cliente", detail: "la zona no coincide" },
      },
    };
    expect(errorMessage(err)).toBe(
      "La zona de la venta no coincide con la del cliente en Microsip."
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

describe("errorMessage · línea rechazada (cuerpo real de mapAppError)", () => {
  it("422 con artículo: el detalle y 'Artículo: <nombre>'", () => {
    expect(errorMessage({ response: { data: CUERPO_422_ARTICULO } })).toBe(
      `${DETAIL_422} · Artículo: ROPERO 3 PUERTAS`,
    );
  });

  it("422 con combo: el detalle y 'Combo: <nombre>'", () => {
    expect(errorMessage({ response: { data: CUERPO_422_COMBO } })).toBe(
      `${DETAIL_422} · Combo: RECAMARA MATRIMONIAL`,
    );
  });

  it("422 sin línea: sólo el detalle, como antes", () => {
    expect(errorMessage({ response: { data: CUERPO_422_SIN_LINEA } })).toBe(CUERPO_422_SIN_LINEA.detail);
  });
});
