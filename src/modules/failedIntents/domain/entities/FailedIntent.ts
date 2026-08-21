import type { IntentStatus, HttpMethod } from "../values";

// FailedIntent is the read model of a captured POST /v2/ventas (or any
// /v2/* path the capture middleware watches) that the backend persisted
// after a 4xx/5xx. The entity is intentionally immutable and "dumb":
// every transition (replay, resolve) goes through the application layer.
//
// Body / hasBlob invariant
// ────────────────────────
// Body and hasBlob are mutually exclusive on the read side:
//   • JSON capture: body holds the parsed JSON (any), hasBlob === false.
//   • Multipart capture: body === null, hasBlob === true and
//     bodyContentType holds the original "multipart/form-data; boundary=..."
//     header so the UI can show the kind. The actual bytes live on disk and
//     are only sent on replay — they never leave the server through this DTO.
//
// The application layer guards against replay-with on blob intents; the UI
// disables the corresponding action. See README.md for the full state
// diagram.
export type FailedIntent = {
  readonly id: string;
  readonly receivedAt: Date;
  // lastSeenAt es el ÚLTIMO intento; receivedAt pasó a ser el PRIMERO cuando
  // el servidor empezó a deduplicar por (path, idempotency-key). Es null en
  // las filas anteriores a esa dedup y en las que sólo se han visto una vez.
  readonly lastSeenAt: Date | null;
  readonly method: HttpMethod;
  readonly path: string;
  readonly firebaseUid: string | null;
  readonly usuarioId: string | null;
  readonly idempotencyKey: string | null;
  readonly requestId: string;
  readonly body: unknown;
  readonly bodyTruncated: boolean;
  readonly hasBlob: boolean;
  readonly bodyContentType: string | null;
  readonly httpStatus: number;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly retryCount: number;
  readonly status: IntentStatus;
  readonly resolvedAt: Date | null;
  readonly resolvedBy: string | null;
  readonly notes: string | null;
};
