// Domain types for the bandeja module (Fase 3c — operator inbox for the
// reactivación copiloto). Mirrors the enriched contract exposed by
// GET/POST /v2/reactivacion/conversaciones* (Fase 3a + Task 1 enrichment).

// UltimaDecision is the condensed decision shown in the bandeja queue row —
// enough to triage without opening the full ficha.
export type UltimaDecision = {
  intencion: string;
  confianza: number;
  accion: string;
  resultado: string;
  razonEscalamiento: string;
};

// ConversacionResumen is one row of the bandeja queue (GET /reactivacion/conversaciones).
export type ConversacionResumen = {
  clienteId: number;
  nombre: string;
  segmento: string;
  estado: string;
  asignadoA: string;
  updatedAt: string;
  ultimoMensaje: string;
  ultimaDecision: UltimaDecision | null;
};

// Conversacion is the state-machine header of one cliente's conversation.
export type Conversacion = {
  clienteId: number;
  nombre: string;
  segmento: string;
  telefono: string;
  estado: string;
  asignadoA: string;
  contextoNota: string;
  banderas: string[];
  resumenMemoria: string;
  createdAt: string;
  updatedAt: string;
};

// Turno is one message in the conversation thread.
export type Turno = {
  direccion: "entrante" | "saliente";
  autor: "cliente" | "ia" | "humano";
  cuerpo: string;
  mensajeRef: string;
  createdAt: string;
};

// Decision is one entry of the decision audit trail.
export type Decision = {
  intencion: string;
  confianza: number;
  senales: string[];
  accion: string;
  borrador: string;
  evidencia: string[];
  razonEscalamiento: string;
  resultado: string;
  createdAt: string;
};

// ConversacionDetalle is the full ficha view for one cliente.
export type ConversacionDetalle = {
  conversacion: Conversacion;
  turnos: Turno[];
  decisiones: Decision[];
};

// DecisionResult is the outcome of processing an inbound message
// (POST .../mensaje-entrante).
export type DecisionResult = {
  intencion: string;
  confianza: number;
  senales: string[];
  accion: string;
  borrador: string;
  evidencia: string[];
  razonEscalamiento: string;
  resultado: string;
  escalada: boolean;
};
