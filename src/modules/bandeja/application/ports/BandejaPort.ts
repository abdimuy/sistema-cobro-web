import type { ConversacionDetalle, ConversacionResumen, DecisionResult } from "../../domain/entities";

// ListarColaParams carries the optional filters for GET /reactivacion/conversaciones.
// soloEscaladas takes precedence over estado at the backend — sending both
// together with estado !== "escalado" would silently yield zero rows.
export type ListarColaParams = {
  estado?: string;
  soloEscaladas?: boolean;
};

// BandejaPort is the outbound interface the bandeja module requires from its
// host. The HTTP adapter satisfies it for production; an in-memory fake
// satisfies it for tests (and, later, for the presentation-layer hooks).
export interface BandejaPort {
  listarCola(
    params?: ListarColaParams,
    signal?: AbortSignal,
  ): Promise<ConversacionResumen[]>;
  obtenerConversacion(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<ConversacionDetalle>;
  aprobar(clienteId: number): Promise<void>;
  editar(clienteId: number, texto: string): Promise<void>;
  dictar(clienteId: number, intencion: string): Promise<{ borrador: string }>;
  escalar(clienteId: number, asignadoA: string): Promise<void>;
  simularEntrante(clienteId: number, mensaje: string): Promise<DecisionResult>;
}
