import { describe, it, expect } from "vitest";
import { dtoToWinbackItem } from "./dtoToWinbackItem";
import type { WinbackItemDTO } from "../http/dtos";

function buildValidDTO(overrides: Partial<WinbackItemDTO> = {}): WinbackItemDTO {
  return {
    cliente_id: 1001,
    nombre: "María López",
    zona: "NORTE",
    telefono: "5551234567",
    fecha_ultima_compra: "2025-03-15T10:00:00Z",
    recencia_dias: 90,
    frecuencia: 5,
    monetary: "12345.67",
    saldo: "3000.00",
    por_liquidar_pct: "0.85",
    next_best_product: "Sofá 3 plazas",
    segmento: "DORMIDO_VALIOSO",
    score: 78,
    en_control: false,
    estado_pago: "AL_CORRIENTE",
    fecha_ultimo_pago: "2025-03-01T08:30:00Z",
    etiqueta: "Recuperable",
    resumen: "Cliente de alto valor, llevan 90 días sin comprar",
    tier: "B",
    ...overrides,
  };
}

describe("dtoToWinbackItem", () => {
  it("happy path: maps all 19 fields correctly", () => {
    const dto = buildValidDTO();
    const item = dtoToWinbackItem(dto);

    expect(item.clienteId).toBe(1001);
    expect(item.nombre).toBe("María López");
    expect(item.zona).toBe("NORTE");
    expect(item.telefono).toBe("5551234567");

    expect(item.fechaUltimaCompra).toBeInstanceOf(Date);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(item.fechaUltimaCompra!.getTime()).toBe(
      new Date("2025-03-15T10:00:00Z").getTime(),
    );

    expect(item.recenciaDias).toBe(90);
    expect(item.frecuencia).toBe(5);
    expect(item.monetary).toBe("12345.67");
    expect(item.saldo).toBe("3000.00");
    expect(item.porLiquidarPct).toBe("0.85");
    expect(item.nextBestProduct).toBe("Sofá 3 plazas");

    expect(item.segmento.value).toBe("DORMIDO_VALIOSO");
    expect(item.score).toBe(78);
    expect(item.enControl).toBe(false);

    expect(item.estadoPago.value).toBe("AL_CORRIENTE");

    expect(item.fechaUltimoPago).toBeInstanceOf(Date);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(item.fechaUltimoPago!.getTime()).toBe(
      new Date("2025-03-01T08:30:00Z").getTime(),
    );

    expect(item.etiqueta).toBe("Recuperable");
    expect(item.resumen).toBe("Cliente de alto valor, llevan 90 días sin comprar");
    expect(item.tier.value).toBe("B");
  });

  it("maps empty fecha_ultima_compra and fecha_ultimo_pago to null", () => {
    const dto = buildValidDTO({ fecha_ultima_compra: "", fecha_ultimo_pago: "" });
    const item = dtoToWinbackItem(dto);
    expect(item.fechaUltimaCompra).toBeNull();
    expect(item.fechaUltimoPago).toBeNull();
  });

  it("throws DomainError with code fecha_ultima_compra_invalida on invalid fecha_ultima_compra", () => {
    const dto = buildValidDTO({ fecha_ultima_compra: "not-a-date" });
    expect(() => dtoToWinbackItem(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_ultima_compra_invalida" }),
    );
  });

  it("throws DomainError with code fecha_ultimo_pago_invalida on invalid fecha_ultimo_pago", () => {
    const dto = buildValidDTO({ fecha_ultimo_pago: "not-a-date" });
    expect(() => dtoToWinbackItem(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_ultimo_pago_invalida" }),
    );
  });

  it("throws DomainError with code segmento_invalido on invalid segmento", () => {
    const dto = buildValidDTO({ segmento: "INVALIDO" });
    expect(() => dtoToWinbackItem(dto)).toThrowError(
      expect.objectContaining({ code: "segmento_invalido" }),
    );
  });

  it("throws DomainError with code estado_pago_invalido on invalid estado_pago", () => {
    const dto = buildValidDTO({ estado_pago: "DESCONOCIDO" });
    expect(() => dtoToWinbackItem(dto)).toThrowError(
      expect.objectContaining({ code: "estado_pago_invalido" }),
    );
  });

  it("throws DomainError with code tier_invalido on invalid tier", () => {
    const dto = buildValidDTO({ tier: "Z" });
    expect(() => dtoToWinbackItem(dto)).toThrowError(
      expect.objectContaining({ code: "tier_invalido" }),
    );
  });
});
