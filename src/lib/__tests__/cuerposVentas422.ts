// Cuerpos EXACTOS que produce msp-api (internal/ventas/infra/venthttp/auth.go,
// mapAppError): generados el 2026-10-16 con json.Marshal(mapAppError(err)) en
// la rama msp-api-precios, para ErrPrecioAnualCreditoRequerido con el campo
// "articulo" y con el campo "combo".
const DETAIL = "en una venta a crédito cada producto y cada combo debe llevar precio anual mayor a cero";

export const CUERPO_422_ARTICULO = {
  title: "Unprocessable Entity",
  status: 422,
  detail: DETAIL,
  errors: [
    { message: "code=precio_anual_credito_requerido" },
    { message: "articulo=ROPERO 3 PUERTAS", location: "linea.articulo", value: "ROPERO 3 PUERTAS" },
  ],
};

export const CUERPO_422_COMBO = {
  title: "Unprocessable Entity",
  status: 422,
  detail: DETAIL,
  errors: [
    { message: "code=precio_anual_credito_requerido" },
    { message: "combo=RECAMARA MATRIMONIAL", location: "linea.combo", value: "RECAMARA MATRIMONIAL" },
  ],
};

/** Mismo error sin línea (cualquier otra regla): no debe cambiar nada. */
export const CUERPO_422_SIN_LINEA = {
  title: "Unprocessable Entity",
  status: 422,
  detail: "los totales de la venta son imposibles: los montos capturados deben ir de menor a mayor: contado, corto plazo y anual",
  errors: [{ message: "code=monto_tier_order_invalid" }],
};

export const DETAIL_422 = DETAIL;

/**
 * POST /v2/ventas/{id}/aplicar con zona distinta: json.Marshal(mapAppError(
 * domain.ErrVentaZonaNoCoincideCliente)), generado el 2026-10-16. No hay
 * `code` de primer nivel.
 */
export const CUERPO_422_ZONA = {
  title: "Unprocessable Entity",
  status: 422,
  detail: "la zona de la venta no coincide con la del cliente en microsip",
  errors: [{ message: "code=venta_zona_no_coincide_cliente" }],
};
