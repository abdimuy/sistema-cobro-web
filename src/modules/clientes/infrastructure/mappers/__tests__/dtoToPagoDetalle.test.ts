import { describe, it, expect } from "vitest";
import { dtoToPagoDetalle } from "../dtoToPagoDetalle";
import { DomainError } from "../../../domain/errors";
import type { PagoDetalleDTO } from "../../http/dtos";

function makeDTO(overrides: Partial<PagoDetalleDTO> = {}): PagoDetalleDTO {
  return {
    importe: "3200.00",
    iva: "0.00",
    fecha: "2025-12-15T10:30:00.000Z",
    forma_cobro_id: 52569,
    forma_cobro: "EFECTIVO",
    referencia: "REF-001",
    cobrador_id: 7,
    cobrador: "José Guadalupe Pérez Morales",
    concepto_cc_id: 87327,
    concepto: "ABONO",
    categoria: "pago",
    es_ingreso: true,
    folio: "AB-00234",
    aplica_a_cargo_id: 55801,
    docto_pv_id: 30015,
    cancelado: false,
    aplicado: true,
    origen: "app",
    ...overrides,
  };
}

describe("dtoToPagoDetalle", () => {
  it("maps all required fields correctly", () => {
    const result = dtoToPagoDetalle(makeDTO());
    expect(result.importe).toBe("3200.00");
    expect(result.iva).toBe("0.00");
    expect(result.fecha).toEqual(new Date("2025-12-15T10:30:00.000Z"));
    expect(result.formaCobroId).toBe(52569);
    expect(result.formaCobro).toBe("EFECTIVO");
    expect(result.referencia).toBe("REF-001");
    expect(result.cobradorId).toBe(7);
    expect(result.cobrador).toBe("José Guadalupe Pérez Morales");
    expect(result.conceptoCcId).toBe(87327);
    expect(result.concepto).toBe("ABONO");
    expect(result.categoria).toBe("pago");
    expect(result.esIngreso).toBe(true);
    expect(result.folio).toBe("AB-00234");
    expect(result.aplicaACargoId).toBe(55801);
    expect(result.doctoPvId).toBe(30015);
    expect(result.cancelado).toBe(false);
    expect(result.aplicado).toBe(true);
    expect(result.origen).toBe("app");
  });

  it("parses lat/lon from strings to numbers", () => {
    const result = dtoToPagoDetalle(
      makeDTO({ lat: "19.4326", lon: "-99.1332" }),
    );
    expect(result.lat).toBe(19.4326);
    expect(result.lon).toBe(-99.1332);
  });

  it("sets lat/lon to null when absent", () => {
    const result = dtoToPagoDetalle(makeDTO());
    expect(result.lat).toBeNull();
    expect(result.lon).toBeNull();
  });

  it("sets lat/lon to null when unparseable", () => {
    const result = dtoToPagoDetalle(
      makeDTO({ lat: "no-es-numero", lon: "tampoco" }),
    );
    expect(result.lat).toBeNull();
    expect(result.lon).toBeNull();
  });

  it("sets recibidoAt/aplicadoAt to null when absent", () => {
    const result = dtoToPagoDetalle(makeDTO());
    expect(result.recibidoAt).toBeNull();
    expect(result.aplicadoAt).toBeNull();
  });

  it("parses optional dates when present", () => {
    const result = dtoToPagoDetalle(
      makeDTO({
        recibido_at: "2025-12-15T10:30:00.000Z",
        aplicado_at: "2025-12-15T10:31:00.000Z",
      }),
    );
    expect(result.recibidoAt).toEqual(new Date("2025-12-15T10:30:00.000Z"));
    expect(result.aplicadoAt).toEqual(new Date("2025-12-15T10:31:00.000Z"));
  });

  it("sets saldoCargo to null when absent", () => {
    const result = dtoToPagoDetalle(makeDTO());
    expect(result.saldoCargo).toBeNull();
  });

  it("keeps saldoCargo as string when present", () => {
    const result = dtoToPagoDetalle(makeDTO({ saldo_cargo: "5300.00" }));
    expect(result.saldoCargo).toBe("5300.00");
  });

  it("narrows origen to microsip when unexpected value", () => {
    const result = dtoToPagoDetalle(makeDTO({ origen: "desconocido" }));
    expect(result.origen).toBe("microsip");
  });

  it("maps categoria via toCategoriaPago (unknown → otro)", () => {
    const result = dtoToPagoDetalle(makeDTO({ categoria: "desconocida" }));
    expect(result.categoria).toBe("otro");
  });

  it("throws DomainError on malformed required fecha", () => {
    expect(() =>
      dtoToPagoDetalle(makeDTO({ fecha: "not-a-date" })),
    ).toThrow(DomainError);
  });

  it("throws DomainError when recibido_at is present-but-invalid", () => {
    expect(() =>
      dtoToPagoDetalle(makeDTO({ recibido_at: "not-a-date" })),
    ).toThrow(DomainError);
  });

  it("throws DomainError when aplicado_at is present-but-invalid", () => {
    expect(() =>
      dtoToPagoDetalle(makeDTO({ aplicado_at: "not-a-date" })),
    ).toThrow(DomainError);
  });
});
