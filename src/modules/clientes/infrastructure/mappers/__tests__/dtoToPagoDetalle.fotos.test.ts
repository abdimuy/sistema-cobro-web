import { describe, expect, it } from "vitest";
import { dtoToPagoDetalle } from "../dtoToPagoDetalle";
import type { PagoDetalleDTO } from "../../http/dtos";

const base: PagoDetalleDTO = {
  importe: "150.00",
  iva: "0.00",
  fecha: "2026-10-14T14:20:00Z",
  forma_cobro_id: 157,
  forma_cobro: "EFECTIVO",
  referencia: "",
  cobrador_id: 11502,
  cobrador: "JUAN CARLOS MENDEZ",
  concepto_cc_id: 87327,
  concepto: "ABONO",
  categoria: "pago",
  es_ingreso: true,
  folio: "AB-15082369",
  aplica_a_cargo_id: 13785217,
  docto_pv_id: 9921,
  cancelado: false,
  aplicado: true,
  origen: "app",
};

describe("dtoToPagoDetalle — fotos del pago (contrato §6)", () => {
  it("mapea pago_recibido_id y num_fotos", () => {
    const d = dtoToPagoDetalle({ ...base, pago_recibido_id: "7a1f39e4-2b6c-4d1e-9f0a-3c5b8e2d1a47", num_fotos: 2 });
    expect(d.pagoRecibidoId).toBe("7a1f39e4-2b6c-4d1e-9f0a-3c5b8e2d1a47");
    expect(d.numFotos).toBe(2);
  });

  it("API anterior sin los campos, o pago de Microsip: sin comprobante, no truena", () => {
    const d = dtoToPagoDetalle(base);
    expect(d.pagoRecibidoId).toBeNull();
    expect(d.numFotos).toBe(0);
    expect(dtoToPagoDetalle({ ...base, pago_recibido_id: null, num_fotos: 0 }).pagoRecibidoId).toBeNull();
  });
});
