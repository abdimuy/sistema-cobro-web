import { describe, it, expect } from "vitest";
import { dtoToVentaCobranza } from "../dtoToVentaCobranza";
import type { VentaCobranzaDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<VentaCobranzaDTO> = {}): VentaCobranzaDTO {
  return {
    venta_id: 1001,
    cliente_id: 5,
    parcialidad: "3",
    frecuencia: "SEMANAL",
    abono_semana: "500.00",
    vencidas: "0.50",
    aporte: "0.85",
    saldo: "4200.00",
    ...overrides,
  };
}

describe("dtoToVentaCobranza", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const dto = buildValidDTO();
    const venta = dtoToVentaCobranza(dto);

    expect(venta.ventaId).toBe(1001);
    expect(venta.clienteId).toBe(5);
    expect(venta.parcialidad).toBe("3");
    expect(venta.frecuencia).toBe("SEMANAL");
    expect(venta.abonoSemana).toBe("500.00");
    expect(venta.vencidas).toBe("0.50");
    expect(venta.aporte).toBe("0.85");
    expect(venta.saldo).toBe("4200.00");
  });

  it("lanza DomainError con code venta_id_invalido si venta_id es cero", () => {
    const dto = buildValidDTO({ venta_id: 0 });
    expect(() => dtoToVentaCobranza(dto)).toThrowError(
      expect.objectContaining({ code: "venta_id_invalido" }),
    );
  });

  it("lanza DomainError con code venta_id_invalido si venta_id no es número", () => {
    const dto = buildValidDTO({ venta_id: "abc" as unknown as number });
    expect(() => dtoToVentaCobranza(dto)).toThrowError(
      expect.objectContaining({ code: "venta_id_invalido" }),
    );
  });

  it("lanza DomainError con code cliente_id_invalido si cliente_id es cero", () => {
    const dto = buildValidDTO({ cliente_id: 0 });
    expect(() => dtoToVentaCobranza(dto)).toThrowError(
      expect.objectContaining({ code: "cliente_id_invalido" }),
    );
  });

  it("lanza DomainError con code saldo_invalido si saldo no es string", () => {
    const dto = buildValidDTO({ saldo: 4200 as unknown as string });
    expect(() => dtoToVentaCobranza(dto)).toThrowError(
      expect.objectContaining({ code: "saldo_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ venta_id: 0 });
    expect(() => dtoToVentaCobranza(dto)).toThrow(DomainError);
  });
});
