// Wire DTOs for the bandeja module. snake_case to match the backend JSON
// exactly — see internal/reactivacion/infra/reactivacionhttp/copiloto_dto.go
// (msp-api, Fase 3a + Task 1 enrichment).

export type UltimaDecisionDTO = {
  intencion: string;
  confianza: number;
  accion: string;
  resultado: string;
  razon_escalamiento: string;
};

// ConversacionResumenDTO matches one item of GET /v2/reactivacion/conversaciones.
export type ConversacionResumenDTO = {
  cliente_id: number;
  nombre: string;
  segmento: string;
  estado: string;
  asignado_a: string;
  updated_at: string;
  ultimo_mensaje: string;
  ultima_decision: UltimaDecisionDTO | null;
};

export type ListConversacionesResponseDTO = {
  items: ConversacionResumenDTO[];
};

// ConversacionDTO matches the `conversacion` field of
// GET /v2/reactivacion/conversaciones/{cliente_id}.
export type ConversacionDTO = {
  cliente_id: number;
  nombre: string;
  segmento: string;
  telefono: string;
  estado: string;
  asignado_a: string;
  contexto_nota: string;
  banderas: string[];
  resumen_memoria: string;
  created_at: string;
  updated_at: string;
};

export type TurnoDTO = {
  direccion: string;
  autor: string;
  cuerpo: string;
  mensaje_ref: string;
  created_at: string;
};

export type DecisionDTO = {
  intencion: string;
  confianza: number;
  senales: string[];
  accion: string;
  borrador: string;
  evidencia: string[];
  razon_escalamiento: string;
  resultado: string;
  created_at: string;
};

// ConversacionDetalleResponseDTO matches
// GET /v2/reactivacion/conversaciones/{cliente_id}.
export type ConversacionDetalleResponseDTO = {
  conversacion: ConversacionDTO;
  turnos: TurnoDTO[];
  decisiones: DecisionDTO[];
};

// DecisionResultDTO matches POST .../mensaje-entrante.
export type DecisionResultDTO = {
  intencion: string;
  confianza: number;
  senales: string[];
  accion: string;
  borrador: string;
  evidencia: string[];
  razon_escalamiento: string;
  resultado: string;
  escalada: boolean;
};

// OkResponseDTO matches POST .../aprobar, .../editar and .../escalar.
export type OkResponseDTO = {
  ok: boolean;
};

// EditarBodyDTO is the request body for POST .../editar.
export type EditarBodyDTO = {
  texto: string;
};

// DictarBodyDTO is the request body for POST .../dictar.
export type DictarBodyDTO = {
  intencion: string;
};

// DictarResponseDTO matches POST .../dictar.
export type DictarResponseDTO = {
  borrador: string;
};

// EscalarBodyDTO is the request body for POST .../escalar.
export type EscalarBodyDTO = {
  asignado_a?: string;
};

// MensajeEntranteBodyDTO is the request body for POST .../mensaje-entrante.
export type MensajeEntranteBodyDTO = {
  mensaje: string;
};
