import { describe, it, expect } from "vitest";
import { dtoToReporteUsuario } from "../dtoToReporteUsuario";
import type { ReporteUsuarioDTO } from "../../http/dtos";
import { DomainError } from "../../../domain/errors";

function buildValidDTO(
  overrides: Partial<ReporteUsuarioDTO> = {},
): ReporteUsuarioDTO {
  return {
    uid: "uid-juan",
    nombre: "JUAN PÉREZ TORRES",
    email: "juan.perez@muebleriamsp.mx",
    cobrador_id: 12,
    zona_id: 3,
    zona_nombre: "ZONA CENTRO",
    num_clientes: 48,
    saldo_total: "125000.00",
    pct_cobertura_semanal: "89.50",
    pct_ponderado_semanal: "92.30",
    fecha_inicio_semana: "2026-06-16T00:00:00Z",
    ...overrides,
  };
}

describe("dtoToReporteUsuario", () => {
  it("happy path: mapea todos los campos correctamente", () => {
    const u = dtoToReporteUsuario(buildValidDTO());
    expect(u.uid).toBe("uid-juan");
    expect(u.nombre).toBe("JUAN PÉREZ TORRES");
    expect(u.email).toBe("juan.perez@muebleriamsp.mx");
    expect(u.cobradorId).toBe(12);
    expect(u.zonaId).toBe(3);
    expect(u.zonaNombre).toBe("ZONA CENTRO");
    expect(u.numClientes).toBe(48);
    expect(u.saldoTotal).toBe("125000.00");
    expect(u.pctCoberturaSemanal).toBe("89.50");
    expect(u.pctPonderadoSemanal).toBe("92.30");
    expect(u.fechaInicioSemana).toBe("2026-06-16T00:00:00Z");
  });

  it("saldoTotal permanece como string decimal", () => {
    const u = dtoToReporteUsuario(buildValidDTO({ saldo_total: "89450.75" }));
    expect(typeof u.saldoTotal).toBe("string");
    expect(u.saldoTotal).toBe("89450.75");
  });

  it("percentages null se mapean a null", () => {
    const u = dtoToReporteUsuario(
      buildValidDTO({
        pct_cobertura_semanal: null,
        pct_ponderado_semanal: null,
      }),
    );
    expect(u.pctCoberturaSemanal).toBeNull();
    expect(u.pctPonderadoSemanal).toBeNull();
  });

  it("lanza DomainError uid_requerido si uid está vacío", () => {
    expect(() => dtoToReporteUsuario(buildValidDTO({ uid: "" }))).toThrowError(
      expect.objectContaining({ code: "uid_requerido" }),
    );
  });

  it("lanza DomainError cobrador_id_invalido si no es número", () => {
    expect(() =>
      dtoToReporteUsuario(
        buildValidDTO({ cobrador_id: "x" as unknown as number }),
      ),
    ).toThrowError(expect.objectContaining({ code: "cobrador_id_invalido" }));
  });

  it("lanza DomainError saldo_total_invalido si no es string", () => {
    expect(() =>
      dtoToReporteUsuario(
        buildValidDTO({ saldo_total: 123 as unknown as string }),
      ),
    ).toThrowError(expect.objectContaining({ code: "saldo_total_invalido" }));
  });

  it("lanza DomainError fecha_inicio_semana_invalida si está vacía", () => {
    expect(() =>
      dtoToReporteUsuario(buildValidDTO({ fecha_inicio_semana: "" })),
    ).toThrowError(
      expect.objectContaining({ code: "fecha_inicio_semana_invalida" }),
    );
  });

  it("DomainError hereda de Error", () => {
    expect(() => dtoToReporteUsuario(buildValidDTO({ uid: "" }))).toThrow(
      DomainError,
    );
  });
});
