import { describe, it, expect } from "vitest";
import { dtoToCliente } from "./dtoToCliente";
import type { ClienteListItemDTO } from "../http/dtos";
import { DomainError } from "../../domain/errors";

function buildValidDTO(overrides: Partial<ClienteListItemDTO> = {}): ClienteListItemDTO {
  return {
    cliente_id: 2001,
    nombre: "Guadalupe Ramírez Torres",
    zona: "ZONA CENTRO",
    telefono: "3311223344",
    direccion_corta: "Morelos 45, Centro, Guadalajara",
    score: 82,
    segmento: "ACTIVO",
    estado_pago: "AL_CORRIENTE",
    tiene_pulso: true,
    recencia_dias: 14,
    saldo: "4500.00",
    ...overrides,
  };
}

describe("dtoToCliente", () => {
  it("happy path: maps all fields correctly when tiene_pulso is true", () => {
    const dto = buildValidDTO();
    const cliente = dtoToCliente(dto);

    expect(cliente.clienteId).toBe(2001);
    expect(cliente.nombre).toBe("Guadalupe Ramírez Torres");
    expect(cliente.zona).toBe("ZONA CENTRO");
    expect(cliente.telefono).toBe("3311223344");
    expect(cliente.direccionCorta).toBe("Morelos 45, Centro, Guadalajara");
    expect(cliente.score).toBe(82);
    expect(cliente.segmento).toBe("ACTIVO");
    expect(cliente.estadoPago).toBe("AL_CORRIENTE");
    expect(cliente.tienePulso).toBe(true);
    expect(cliente.recenciaDias).toBe(14);
    expect(cliente.saldo).toBe("4500.00");
  });

  it("pulse degradation: sets segmento and estadoPago to null when tiene_pulso is false", () => {
    const dto = buildValidDTO({
      tiene_pulso: false,
      segmento: "",
      estado_pago: "",
      score: 0,
      recencia_dias: 0,
    });
    const cliente = dtoToCliente(dto);

    expect(cliente.tienePulso).toBe(false);
    expect(cliente.segmento).toBeNull();
    expect(cliente.estadoPago).toBeNull();
  });

  it("pulse degradation: does NOT throw when tiene_pulso is false and segmento/estado_pago are empty", () => {
    const dto = buildValidDTO({ tiene_pulso: false, segmento: "", estado_pago: "" });
    expect(() => dtoToCliente(dto)).not.toThrow();
  });

  it("saldo is kept as decimal string, not parsed to float", () => {
    const dto = buildValidDTO({ saldo: "12345.67" });
    const cliente = dtoToCliente(dto);
    expect(cliente.saldo).toBe("12345.67");
    expect(typeof cliente.saldo).toBe("string");
  });

  it("throws DomainError with code segmento_invalido on invalid segmento when tiene_pulso is true", () => {
    const dto = buildValidDTO({ segmento: "SEGMENTO_INEXISTENTE" });
    expect(() => dtoToCliente(dto)).toThrowError(
      expect.objectContaining({ code: "segmento_invalido" }),
    );
  });

  it("throws DomainError with code estado_pago_invalido on invalid estado_pago when tiene_pulso is true", () => {
    const dto = buildValidDTO({ estado_pago: "INVALIDO" });
    expect(() => dtoToCliente(dto)).toThrowError(
      expect.objectContaining({ code: "estado_pago_invalido" }),
    );
  });

  it("maps a client with zero saldo", () => {
    const dto = buildValidDTO({ saldo: "0.00" });
    const cliente = dtoToCliente(dto);
    expect(cliente.saldo).toBe("0.00");
  });

  it("maps segmento DORMIDO_VALIOSO correctly", () => {
    const dto = buildValidDTO({ segmento: "DORMIDO_VALIOSO" });
    const cliente = dtoToCliente(dto);
    expect(cliente.segmento).toBe("DORMIDO_VALIOSO");
  });

  it("maps estado_pago MOROSO correctly", () => {
    const dto = buildValidDTO({ estado_pago: "MOROSO" });
    const cliente = dtoToCliente(dto);
    expect(cliente.estadoPago).toBe("MOROSO");
  });

  it("maps estado_pago SIN_CREDITO correctly", () => {
    const dto = buildValidDTO({ estado_pago: "SIN_CREDITO" });
    const cliente = dtoToCliente(dto);
    expect(cliente.estadoPago).toBe("SIN_CREDITO");
  });

  it("pulse degradation does not validate segmento even if invalid string provided", () => {
    const dto = buildValidDTO({ tiene_pulso: false, segmento: "BASURA", estado_pago: "" });
    const cliente = dtoToCliente(dto);
    expect(cliente.segmento).toBeNull();
    expect(cliente.estadoPago).toBeNull();
  });

  it("result type matches DomainError check (no instanceof guard needed externally)", () => {
    const dto = buildValidDTO({ tiene_pulso: false, segmento: "", estado_pago: "" });
    const result = dtoToCliente(dto);
    expect(result).not.toBeInstanceOf(DomainError);
  });
});
