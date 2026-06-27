import { describe, it, expect } from "vitest";
import { dtoToCobradorPerformance } from "./dtoToCobradorPerformance";
import type { CobradorPerformanceDTO } from "../http/dtos";

function makeDto(overrides: Partial<CobradorPerformanceDTO> = {}): CobradorPerformanceDTO {
  return {
    cobrador_id: 1,
    cobrador_nombre: "GARCIA LOPEZ",
    zona_cliente_id: 10,
    cei: "0.85",
    par: "0.12",
    pct_corriente: "0.88",
    saldo_total: "100000.00",
    saldo_moroso: "12000.00",
    cuentas_total: 50,
    importe_colectado: "30000.00",
    ...overrides,
  };
}

describe("dtoToCobradorPerformance", () => {
  it("maps all fields correctly", () => {
    const entity = dtoToCobradorPerformance(makeDto());
    expect(entity.cobradorId).toBe(1);
    expect(entity.cobradorNombre).toBe("GARCIA LOPEZ");
    expect(entity.zonaClienteId).toBe(10);
    expect(entity.cei).toBe("0.85");
    expect(entity.par).toBe("0.12");
    expect(entity.pctCorriente).toBe("0.88");
    expect(entity.saldoTotal).toBe("100000.00");
    expect(entity.saldoMoroso).toBe("12000.00");
    expect(entity.cuentasTotal).toBe(50);
    expect(entity.importeColectado).toBe("30000.00");
  });

  it("preserves non-empty cobrador_nombre", () => {
    const entity = dtoToCobradorPerformance(makeDto({ cobrador_nombre: "MARTINEZ RUIZ" }));
    expect(entity.cobradorNombre).toBe("MARTINEZ RUIZ");
  });

  it("preserves empty cobrador_nombre when cobrador_id is 0", () => {
    const entity = dtoToCobradorPerformance(makeDto({ cobrador_id: 0, cobrador_nombre: "" }));
    expect(entity.cobradorId).toBe(0);
    expect(entity.cobradorNombre).toBe("");
  });
});
