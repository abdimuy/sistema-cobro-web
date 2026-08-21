import type { FailedIntent } from "../../domain/entities";
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
  };
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
