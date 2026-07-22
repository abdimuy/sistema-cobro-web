import { describe, it, expect } from "vitest";
import { dtoToConversacionDetalle } from "../dtoToConversacionDetalle";
import type { ConversacionDetalleResponseDTO } from "../../http/dtos";

function buildDTO(): ConversacionDetalleResponseDTO {
  return {
    conversacion: {
      cliente_id: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      telefono: "2381234567",
      estado: "contactado",
      asignado_a: "",
      contexto_nota: "cliente puntual",
      banderas: ["puntual"],
      resumen_memoria: "conversación inicial",
      created_at: "2026-07-21T09:00:00Z",
      updated_at: "2026-07-21T10:00:00Z",
    },
    turnos: [
      {
        direccion: "entrante",
        autor: "cliente",
        cuerpo: "hola",
        mensaje_ref: "",
        created_at: "2026-07-21T09:30:00Z",
      },
      {
        direccion: "saliente",
        autor: "ia",
        cuerpo: "hola, ¿en qué te apoyo?",
        mensaje_ref: "msg-1",
        created_at: "2026-07-21T09:31:00Z",
      },
    ],
    decisiones: [
      {
        intencion: "agradece",
        confianza: 92,
        senales: ["senal_compra"],
        accion: "responder",
        borrador: "de nada, con gusto",
        evidencia: ["gracias"],
        razon_escalamiento: "",
        resultado: "propuesto",
        created_at: "2026-07-21T09:31:00Z",
      },
    ],
  };
}

describe("dtoToConversacionDetalle", () => {
  it("mapea el encabezado (conversacion) a camelCase", () => {
    const result = dtoToConversacionDetalle(buildDTO());

    expect(result.conversacion).toEqual({
      clienteId: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      telefono: "2381234567",
      estado: "contactado",
      asignadoA: "",
      contextoNota: "cliente puntual",
      banderas: ["puntual"],
      resumenMemoria: "conversación inicial",
      createdAt: "2026-07-21T09:00:00Z",
      updatedAt: "2026-07-21T10:00:00Z",
    });
  });

  it("mapea el hilo de turnos preservando el orden", () => {
    const result = dtoToConversacionDetalle(buildDTO());

    expect(result.turnos).toHaveLength(2);
    expect(result.turnos[0]).toEqual({
      direccion: "entrante",
      autor: "cliente",
      cuerpo: "hola",
      mensajeRef: "",
      createdAt: "2026-07-21T09:30:00Z",
    });
    expect(result.turnos[1]).toEqual({
      direccion: "saliente",
      autor: "ia",
      cuerpo: "hola, ¿en qué te apoyo?",
      mensajeRef: "msg-1",
      createdAt: "2026-07-21T09:31:00Z",
    });
  });

  it("mapea la bitácora de decisiones", () => {
    const result = dtoToConversacionDetalle(buildDTO());

    expect(result.decisiones).toHaveLength(1);
    expect(result.decisiones[0]).toEqual({
      intencion: "agradece",
      confianza: 92,
      senales: ["senal_compra"],
      accion: "responder",
      borrador: "de nada, con gusto",
      evidencia: ["gracias"],
      razonEscalamiento: "",
      resultado: "propuesto",
      createdAt: "2026-07-21T09:31:00Z",
    });
  });

  it("listas vacías se mapean a arreglos vacíos, no undefined", () => {
    const dto = buildDTO();
    dto.turnos = [];
    dto.decisiones = [];

    const result = dtoToConversacionDetalle(dto);

    expect(result.turnos).toEqual([]);
    expect(result.decisiones).toEqual([]);
  });
});
