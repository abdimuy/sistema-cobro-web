import type { FailedIntentDTO } from "../../../modules/failedIntents/infrastructure/mappers/dtoToFailedIntent";

// Canonical DTO fixtures shaped exactly like the backend serializes them.
// Tests deep-clone before mutating.

export const jsonIntentDTO: FailedIntentDTO = {
  id: "11111111-1111-1111-1111-111111111111",
  received_at: "2026-06-06T12:34:56.123456789Z",
  method: "POST",
  path: "/v2/ventas",
  firebase_uid: "fb-uid-test",
  usuario_id: "22222222-2222-2222-2222-222222222222",
  idempotency_key: "idem-test-001",
  request_id: "33333333-3333-3333-3333-333333333333",
  body: { cliente: "Carlos Méndez", venta_id: "v-1" },
  body_truncated: false,
  has_blob: false,
  http_status: 422,
  error_code: "cliente_rfc_invalid",
  error_message: "rfc del cliente inválido",
  retry_count: 0,
  status: "new",
};

export const blobIntentDTO: FailedIntentDTO = {
  id: "44444444-4444-4444-4444-444444444444",
  received_at: "2026-06-06T12:35:00.000Z",
  method: "POST",
  path: "/v2/ventas",
  firebase_uid: "fb-uid-test",
  usuario_id: "22222222-2222-2222-2222-222222222222",
  request_id: "55555555-5555-5555-5555-555555555555",
  body: null,
  body_truncated: false,
  has_blob: true,
  body_content_type: "multipart/form-data; boundary=----WebKitFormBoundary",
  http_status: 409,
  error_code: "idempotency_key_mismatch",
  retry_count: 0,
  status: "new",
};

export const resolvedIntentDTO: FailedIntentDTO = {
  ...jsonIntentDTO,
  id: "66666666-6666-6666-6666-666666666666",
  status: "ignored",
  resolved_at: "2026-06-06T13:00:00.000Z",
  resolved_by: "77777777-7777-7777-7777-777777777777",
  notes: "duplicado",
};
