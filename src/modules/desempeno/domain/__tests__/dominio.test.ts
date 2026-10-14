import { describe, expect, it } from "vitest";
import {
  esEstadoCuenta,
  esSegmento,
  esTrato,
  ESTADOS_CUENTA,
  TRATOS,
} from "../values/estadoCuenta";
import {
  FILTROS_ACTIVIDAD_INICIALES,
  FORMAS_COBRO,
  refImagenesDeActividad,
} from "../entities";
import {
  makeActividadCondonacion,
  makeActividadPago,
  makeActividadVisita,
} from "../../application/__tests__/fakeDesempenoPort";

describe("catálogos del contrato", () => {
  it("tiene los 8 estados y los 8 tratos del teléfono, con los códigos del contrato", () => {
    expect(ESTADOS_CUENTA).toEqual([
      "pago", "abono_parcial", "visite_vuelvo", "prometio_proxima",
      "se_nego", "cita_a_una_hora", "no_estaba", "sin_tocar",
    ]);
    expect(TRATOS).toEqual([
      "pagado", "parcial", "regresas", "diferido",
      "escalar", "cita", "nadie", "sin_trabajar",
    ]);
  });

  it("las guardas aceptan solo códigos conocidos", () => {
    expect(esEstadoCuenta("no_estaba")).toBe(true);
    expect(esEstadoCuenta("NO_ESTABA")).toBe(false);
    expect(esEstadoCuenta(3)).toBe(false);
    expect(esTrato("sin_trabajar")).toBe(true);
    expect(esTrato("falta")).toBe(false);
    expect(esSegmento("sin_visitar")).toBe(true);
    // "sin_nada" es un filtro de la pestaña, no un segmento del contrato.
    expect(esSegmento("sin_nada")).toBe(false);
  });

  it("las formas de cobro son los códigos del contrato v2 §1 (no existe Depósito)", () => {
    expect(FORMAS_COBRO).toEqual(["efectivo", "transferencia", "cheque", "condonacion", "otra"]);
  });

  it("una visita trae el trato y la etiqueta del servidor (contrato v2)", () => {
    const visita = makeActividadVisita().visita!;
    expect(visita.trato).toBe("nadie");
    expect(visita.etiqueta).toBe("No estaba");
    expect(esTrato(visita.trato)).toBe(true);
  });
});

describe("refImagenesDeActividad", () => {
  it("un pago con pago_recibido_id y fotos apunta a las fotos del pago", () => {
    const ref = refImagenesDeActividad(makeActividadPago());
    expect(ref).toEqual({
      tipo: "pago",
      pagoRecibidoId: "7a1f39e4-2b6c-4d1e-9f0a-3c5b8e2d1a47",
    });
  });

  it("una visita con fotos apunta a las fotos de la visita", () => {
    expect(refImagenesDeActividad(makeActividadVisita())).toEqual({
      tipo: "visita",
      visitaId: "412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
    });
  });

  it("sin fotos no hay a dónde ir", () => {
    expect(refImagenesDeActividad(makeActividadPago({ numFotos: 0 }))).toBeNull();
  });

  it("un pago sin pago_recibido_id (Microsip, legado) no tiene fotos que pedir", () => {
    const pago = makeActividadPago();
    const sinId = makeActividadPago({
      pago: { ...pago.pago!, pagoRecibidoId: null },
    });
    expect(refImagenesDeActividad(sinId)).toBeNull();
    expect(refImagenesDeActividad(makeActividadCondonacion())).toBeNull();
  });
});

describe("FILTROS_ACTIVIDAD_INICIALES", () => {
  it("ordena por hora descendente y no filtra nada (default del contrato §4)", () => {
    expect(FILTROS_ACTIVIDAD_INICIALES.orden).toBe("hora");
    expect(FILTROS_ACTIVIDAD_INICIALES.dir).toBe("desc");
    expect(FILTROS_ACTIVIDAD_INICIALES.tipos).toEqual([]);
    expect(FILTROS_ACTIVIDAD_INICIALES.desde).toBeNull();
  });
});
