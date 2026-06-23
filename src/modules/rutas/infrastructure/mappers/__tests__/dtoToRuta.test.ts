import { describe, it, expect } from "vitest";
import { dtoToRuta } from "../dtoToRuta";
import type { RutaResumenDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(overrides: Partial<RutaResumenDTO> = {}): RutaResumenDTO {
  return {
    zona_id: 3,
    zona_nombre: "ZONA CENTRO",
    cobrador_id: 12,
    cobrador_nombre: "JUAN PÉREZ TORRES",
    num_clientes: 48,
    saldo_total: "125000.00",
    pct_cobertura_semanal: null,
    pct_ponderado_semanal: null,
    fecha_inicio_semana: null,
    ...overrides,
  };
}

describe("dtoToRuta", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const dto = buildValidDTO();
    const ruta = dtoToRuta(dto);

    expect(ruta.zonaId).toBe(3);
    expect(ruta.zonaNombre).toBe("ZONA CENTRO");
    expect(ruta.cobradorNombre).toBe("JUAN PÉREZ TORRES");
    expect(ruta.numClientes).toBe(48);
    expect(ruta.saldoTotal).toBe("125000.00");
  });

  it("cobrador_nombre vacío queda como cadena vacía (sin asignar)", () => {
    const dto = buildValidDTO({ cobrador_id: null, cobrador_nombre: "" });
    const ruta = dtoToRuta(dto);
    expect(ruta.cobradorNombre).toBe("");
  });

  it("saldoTotal permanece como string decimal", () => {
    const dto = buildValidDTO({ saldo_total: "89450.75" });
    const ruta = dtoToRuta(dto);
    expect(typeof ruta.saldoTotal).toBe("string");
    expect(ruta.saldoTotal).toBe("89450.75");
  });

  it("lanza DomainError con code zona_id_invalido si zona_id no es número", () => {
    const dto = buildValidDTO({ zona_id: "abc" as unknown as number });
    expect(() => dtoToRuta(dto)).toThrowError(
      expect.objectContaining({ code: "zona_id_invalido" }),
    );
  });

  it("lanza DomainError con code zona_nombre_requerido si zona_nombre está vacío", () => {
    const dto = buildValidDTO({ zona_nombre: "" });
    expect(() => dtoToRuta(dto)).toThrowError(
      expect.objectContaining({ code: "zona_nombre_requerido" }),
    );
  });

  it("lanza DomainError con code zona_nombre_requerido si zona_nombre es solo espacios", () => {
    const dto = buildValidDTO({ zona_nombre: "   " });
    expect(() => dtoToRuta(dto)).toThrowError(
      expect.objectContaining({ code: "zona_nombre_requerido" }),
    );
  });

  it("lanza DomainError con code num_clientes_invalido si num_clientes no es número", () => {
    const dto = buildValidDTO({ num_clientes: "muchos" as unknown as number });
    expect(() => dtoToRuta(dto)).toThrowError(
      expect.objectContaining({ code: "num_clientes_invalido" }),
    );
  });

  it("lanza DomainError con code saldo_total_invalido si saldo_total no es string", () => {
    const dto = buildValidDTO({ saldo_total: 12345 as unknown as string });
    expect(() => dtoToRuta(dto)).toThrowError(
      expect.objectContaining({ code: "saldo_total_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ zona_nombre: "" });
    expect(() => dtoToRuta(dto)).toThrow(DomainError);
  });

  it("mapea los campos de cobertura semanal cuando están presentes", () => {
    const dto = buildValidDTO({
      pct_cobertura_semanal: "78.5",
      pct_ponderado_semanal: "65.2",
      fecha_inicio_semana: "2026-06-16",
    });
    const ruta = dtoToRuta(dto);
    expect(ruta.pctCoberturaSemanal).toBe("78.5");
    expect(ruta.pctPonderadoSemanal).toBe("65.2");
    expect(ruta.fechaInicioSemana).toBe("2026-06-16");
  });

  it("mapea los campos de cobertura semanal como null cuando son null", () => {
    const dto = buildValidDTO({
      pct_cobertura_semanal: null,
      pct_ponderado_semanal: null,
      fecha_inicio_semana: null,
    });
    const ruta = dtoToRuta(dto);
    expect(ruta.pctCoberturaSemanal).toBeNull();
    expect(ruta.pctPonderadoSemanal).toBeNull();
    expect(ruta.fechaInicioSemana).toBeNull();
  });
});
