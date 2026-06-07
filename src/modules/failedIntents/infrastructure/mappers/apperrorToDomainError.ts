import axios from "axios";
import { DomainError } from "../../domain/errors";

// Map of backend apperror codes → user-friendly Spanish messages.
// The codes are stable; the messages are presentation-layer copy.
// Anything not listed falls through to whatever message the backend
// returned (apperror always populates a Spanish `message`/`detail`).
const FRIENDLY_MESSAGES: Record<string, string> = {
  failed_intent_not_found: "este intento ya no existe",
  invalid_cursor: "filtros inválidos, recargá la pantalla",
  invalid_status: "filtros inválidos, recargá la pantalla",
  failed_intent_status_conflict:
    "otro usuario ya cambió el estado de este intento",
  blob_intent_replay_with_unsupported:
    "no se puede editar el body de un intento con imágenes; usá replay tal cual",
  intent_has_no_usuario:
    "intento sin vendedor asociado, no se puede replayear",
  usuario_not_found: "el vendedor original ya no está disponible",
  user_inactive: "el vendedor original ya no está activo",
  failed_intent_blob_unavailable:
    "el archivo del intento se perdió, no se puede replayear automáticamente",
  failed_intent_blob_open_failed:
    "el archivo del intento se perdió, no se puede replayear automáticamente",
  // Auth gates surfaced by RequirePermission on the backend.
  forbidden:
    "no tenés permisos para esta acción; pedile al administrador failed_intents:ver/resolver",
};

export function apperrorToDomainError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;

  if (axios.isAxiosError(err)) {
    const data = (err.response?.data ?? {}) as Record<string, unknown>;

    const code =
      (typeof data.code === "string" && data.code) ||
      extractCodeFromHuma(data) ||
      (err.code === "ECONNABORTED" ? "timeout" : null) ||
      (err.message?.toLowerCase().includes("network") ? "network_error" : null) ||
      `http_${err.response?.status ?? "error"}`;

    const backendMessage =
      (typeof data.message === "string" && data.message) ||
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.title === "string" && data.title) ||
      err.message ||
      "error de red";

    const friendly = FRIENDLY_MESSAGES[code];
    return new DomainError(code, friendly ?? backendMessage);
  }

  if (err instanceof Error) {
    return new DomainError("error_inesperado", err.message);
  }
  return new DomainError("error_inesperado", String(err));
}

function extractCodeFromHuma(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data || !Array.isArray(data.errors)) return null;
  for (const e of data.errors) {
    if (
      e &&
      typeof e === "object" &&
      typeof (e as { message?: unknown }).message === "string"
    ) {
      const m = (e as { message: string }).message;
      const colonIdx = m.indexOf(":");
      if (colonIdx > 0 && /^[a-z_]+$/.test(m.slice(0, colonIdx))) {
        return m.slice(0, colonIdx);
      }
    }
  }
  return null;
}
