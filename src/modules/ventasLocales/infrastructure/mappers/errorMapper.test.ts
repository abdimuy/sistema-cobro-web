import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { mapAxiosError } from "./errorMapper";
import {
  CUERPO_422_ARTICULO,
  CUERPO_422_COMBO,
  CUERPO_422_SIN_LINEA,
  DETAIL_422,
} from "@/lib/__tests__/cuerposVentas422";

function error422(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = { status: 422, statusText: "", data, headers: {}, config };
  return new AxiosError("Request failed with status code 422", "ERR_BAD_REQUEST", config, {}, response);
}

describe("mapAxiosError · línea rechazada (guardar la edición)", () => {
  it("artículo: código del detalle y mensaje con 'Artículo: <nombre>'", () => {
    const e = mapAxiosError(error422(CUERPO_422_ARTICULO));
    expect(e.code).toBe("precio_anual_credito_requerido");
    expect(e.message).toBe(`${DETAIL_422} · Artículo: ROPERO 3 PUERTAS`);
  });

  it("combo: 'Combo: <nombre>'", () => {
    expect(mapAxiosError(error422(CUERPO_422_COMBO)).message).toBe(`${DETAIL_422} · Combo: RECAMARA MATRIMONIAL`);
  });

  it("sin línea: el mensaje no cambia", () => {
    const e = mapAxiosError(error422(CUERPO_422_SIN_LINEA));
    expect(e.code).toBe("monto_tier_order_invalid");
    expect(e.message).toBe(CUERPO_422_SIN_LINEA.detail);
  });
});
