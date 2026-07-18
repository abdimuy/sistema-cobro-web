import axios from "axios";
import { DomainError } from "../../domain/errors";

// Map of backend apperror codes → user-friendly Spanish messages.
// The codes are stable; the messages are presentation-layer copy.
// Anything not listed falls through to whatever message the backend
// returned (apperror always populates a Spanish `message`/`detail`).
const FRIENDLY_MESSAGES: Record<string, string> = {
  forbidden:
    "no tienes permisos para administrar vendedores; solicita acceso al administrador",
  vendedor_lista_id_no_pertenece:
    "el identificador de vendedor seleccionado no existe en Microsip",
  usuario_no_existe: "el usuario ya no existe",
  zona_no_existe: "la zona seleccionada ya no existe",
  caja_no_existe: "la caja seleccionada no existe en Microsip",
  cajero_no_existe: "el cajero seleccionado no existe en Microsip",
  vendedor_no_existe: "el vendedor seleccionado no existe en Microsip",
  cobrador_no_existe: "el cobrador seleccionado no existe en Microsip",
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

// codeFromMessage extracts a backend apperror code from a single string.
// The real msp-api backend (huma.NewError + &huma.ErrorDetail{Message: "code="
// + ae.Code}, see internal/config/infra/confighttp/auth.go mapAppError) emits
// "code=<the_code>" — never a colon. We also tolerate a legacy "<code>: ..."
// form defensively, in case some other error path still uses it.
function codeFromMessage(m: string): string | null {
  const eqMatch = /(?:^|\s)code=([a-z_]+)/.exec(m);
  if (eqMatch) return eqMatch[1];

  const colonIdx = m.indexOf(":");
  if (colonIdx > 0 && /^[a-z_]+$/.test(m.slice(0, colonIdx))) {
    return m.slice(0, colonIdx);
  }
  return null;
}

// extractCodeFromHuma reads the apperror code out of a Huma ErrorModel JSON
// body: `{ title, status, detail, errors: [ { message } ] }`. mapAppError
// puts "code=<code>" in `errors[0].message` and the human Spanish text (the
// apperror's own Message) in `detail` — there is never a top-level `code`
// field, and `title` is Huma's generic http.StatusText for the status code.
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
      const code = codeFromMessage((e as { message: string }).message);
      if (code) return code;
    }
  }

  return null;
}
