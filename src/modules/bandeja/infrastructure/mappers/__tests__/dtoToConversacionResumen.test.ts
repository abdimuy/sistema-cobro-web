import { describe, it, expect } from "vitest";
import { dtoToConversacionResumen } from "../dtoToConversacionResumen";
import type { ConversacionResumenDTO } from "../../http/dtos";

function buildDTO(overrides: Partial<ConversacionResumenDTO> = {}): ConversacionResumenDTO {
  return {
    cliente_id: 24037,
    nombre: "MINERVA LOPEZ",
    segmento: "recien_liquidado",
    estado: "contactado",
    asignado_a: "",
    updated_at: "2026-07-21T10:00:00Z",
    ultimo_mensaje: "hola",
    ultima_decision: {
      intencion: "agradece",
      confianza: 92,
      accion: "responder",
      resultado: "propuesto",
      razon_escalamiento: "",
    },
    ...overrides,
  };
}

describe("dtoToConversacionResumen", () => {
  it("happy path: mapea todos los campos a camelCase", () => {
    const result = dtoToConversacionResumen(buildDTO());

    expect(result).toEqual({
      clienteId: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      estado: "contactado",
      asignadoA: "",
      updatedAt: "2026-07-21T10:00:00Z",
      ultimoMensaje: "hola",
      ultimaDecision: {
        intencion: "agradece",
        confianza: 92,
        accion: "responder",
        resultado: "propuesto",
        razonEscalamiento: "",
      },
    });
  });

  it("ultima_decision null se mapea a null", () => {
    const result = dtoToConversacionResumen(buildDTO({ ultima_decision: null }));
    expect(result.ultimaDecision).toBeNull();
  });

  it("asignado_a vacío se preserva como string vacía (no asignada)", () => {
    const result = dtoToConversacionResumen(buildDTO({ asignado_a: "" }));
    expect(result.asignadoA).toBe("");
  });
});
