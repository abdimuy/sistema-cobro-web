import type { FailedIntent, ResumenIntento } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { HttpMethod, IntentStatus } from "../../domain/values";

// Shape mirror of the backend IntentDTO. Optional fields use the same
// presence rules as Go's `omitempty`: absent OR empty string maps to
// null in the entity.
export type FailedIntentDTO = {
  id: string;
  received_at: string;
  last_seen_at?: string | null;
  method: string;
  path: string;
  firebase_uid?: string;
  usuario_id?: string | null;
  idempotency_key?: string;
  request_id: string;
  body: unknown;
  body_truncated: boolean;
  has_blob: boolean;
  body_content_type?: string;
  http_status: number;
  error_code?: string;
  error_message?: string;
  retry_count: number;
  status: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  notes?: string;
  modulo?: string;
  resumen?: ResumenDTO | null;
};

// ResumenDTO es la forma del `resumen` que manda el listado. Todos sus campos
// son opcionales porque el servidor los omite (`omitempty`) cuando no los pudo
// extraer, y un campo ausente es un dato: significa "no lo sé", no "vacío".
export type ResumenDTO = {
  titulo?: string;
  monto?: string;
  referencia?: string;
  // cliente lo resuelve el servidor contra CLIENTES para los pagos, cuyo
  // cuerpo trae el id del cliente pero no su nombre.
  cliente?: string;
};

export function dtoToFailedIntent(dto: FailedIntentDTO): FailedIntent {
  const method = HttpMethod.create(dto.method);
  if (method instanceof DomainError) throw method;

  const status = IntentStatus.create(dto.status);
  if (status instanceof DomainError) throw status;

  const receivedAt = new Date(dto.received_at);
  if (isNaN(receivedAt.getTime())) {
    throw new DomainError(
      "received_at_invalido",
      `received_at no es un timestamp válido: ${dto.received_at}`,
    );
  }

  // last_seen_at es opcional a propósito: un servidor anterior a la dedup no
  // lo manda, y una fila vista una sola vez no lo tiene. En ambos casos el
  // último intento ES receivedAt, y la pantalla lo resuelve así.
  const lastSeenAt = fechaOpcional(dto.last_seen_at, "last_seen_at");

  let resolvedAt: Date | null = null;
  if (dto.resolved_at) {
    const d = new Date(dto.resolved_at);
    if (isNaN(d.getTime())) {
      throw new DomainError(
        "resolved_at_invalido",
        `resolved_at no es un timestamp válido: ${dto.resolved_at}`,
      );
    }
    resolvedAt = d;
  }

  return {
    id: dto.id,
    receivedAt,
    lastSeenAt,
    method,
    path: dto.path,
    firebaseUid: dto.firebase_uid ?? null,
    usuarioId: dto.usuario_id ?? null,
    idempotencyKey: dto.idempotency_key ?? null,
    requestId: dto.request_id,
    body: dto.body,
    bodyTruncated: dto.body_truncated,
    hasBlob: dto.has_blob,
    bodyContentType: dto.body_content_type ?? null,
    httpStatus: dto.http_status,
    errorCode: dto.error_code ?? null,
    errorMessage: dto.error_message ?? null,
    retryCount: dto.retry_count,
    status,
    resolvedAt,
    resolvedBy: dto.resolved_by ?? null,
    notes: dto.notes ?? null,
    modulo: textoOpcional(dto.modulo),
    resumen: dtoAResumen(dto.resumen),
  };
}

// dtoAResumen convierte el resumen del servidor. Devuelve null cuando no viene
// o cuando viene sin nada dentro: la pantalla distingue "no hay resumen" —y
// entonces cae a leer el cuerpo— de "hay resumen y dice esto".
export function dtoAResumen(dto: ResumenDTO | null | undefined): ResumenIntento | null {
  if (!dto) return null;
  const titulo = textoOpcional(dto.titulo);
  const monto = montoOpcional(dto.monto);
  const referencia = textoOpcional(dto.referencia);
  const cliente = textoOpcional(dto.cliente);
  if (titulo === null && monto === null && referencia === null && cliente === null) {
    return null;
  }
  return { titulo, monto, referencia, cliente };
}

// montoOpcional parsea el monto, que viaja como CADENA decimal a propósito: el
// contrato evita el float binario, y aquí se convierte una sola vez a número
// SÓLO para mostrarlo. Nunca se opera con él.
//
// Un monto ilegible se descarta en silencio en vez de reventar el listado: la
// fila sigue siendo evidencia útil sin su importe, y tirar la pantalla entera
// por un adorno sería el peor intercambio posible.
function montoOpcional(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// textoOpcional normaliza ausente / vacío / puros espacios a null. El servidor
// omite los campos vacíos, pero un cliente intermedio podría mandar "".
function textoOpcional(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const limpio = raw.trim();
  return limpio === "" ? null : limpio;
}

// fechaOpcional parsea un timestamp que puede faltar. Una fecha presente pero
// ilegible SÍ es un error: significa que el contrato cambió y callarlo dejaría
// la pantalla mintiendo sobre cuándo pasó algo.
function fechaOpcional(raw: string | null | undefined, campo: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(
      `${campo}_invalido`,
      `${campo} no es un timestamp válido: ${raw}`,
    );
  }
  return d;
}
