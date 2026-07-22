import { describe, it, expect } from "vitest";
import { dtoToDecisionResult } from "../dtoToDecisionResult";
import type { DecisionResultDTO } from "../../http/dtos";

function buildDTO(overrides: Partial<DecisionResultDTO> = {}): DecisionResultDTO {
  return {
    intencion: "quiere comprar",
    confianza: 88,
    senales: ["senal_compra"],
    accion: "responder",
    borrador: "con gusto te apoyo",
    evidencia: ["quiero comprar algo"],
    razon_escalamiento: "",
    resultado: "propuesto",
    escalada: false,
    ...overrides,
  };
}

describe("dtoToDecisionResult", () => {
  it("mapea todos los campos a camelCase", () => {
    const result = dtoToDecisionResult(buildDTO());

    expect(result).toEqual({
      intencion: "quiere comprar",
      confianza: 88,
      senales: ["senal_compra"],
      accion: "responder",
      borrador: "con gusto te apoyo",
      evidencia: ["quiero comprar algo"],
      razonEscalamiento: "",
      resultado: "propuesto",
      escalada: false,
    });
  });

  it("escalada true se preserva", () => {
    const result = dtoToDecisionResult(
      buildDTO({ escalada: true, accion: "escalar", borrador: "", resultado: "escalado" }),
    );

    expect(result.escalada).toBe(true);
    expect(result.borrador).toBe("");
  });
});
