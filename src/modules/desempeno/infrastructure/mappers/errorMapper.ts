import axios from "axios";
import { DomainError } from "../../domain/errors";

// Mensajes propios solo para lo que el servidor no explica. Lo demás usa el
// `detail` en español que manda msp-api.
const MENSAJES: Record<string, string> = {
  network_error: "no hay conexión con el servidor",
  timeout: "el servidor tardó demasiado en responder",
};

// msp-api manda los errores de Huma como { detail, errors: [{ message: "code=..." }] }
// (internal/rutas/infra/rutashttp/auth.go:mapAppError). También se acepta
// `code` plano (Problem Details) y "code: mensaje".
function codigoHuma(data: Record<string, unknown>): string | null {
  if (!Array.isArray(data.errors)) return null;
  for (const e of data.errors) {
    const m = e && typeof e === "object" ? (e as { message?: unknown }).message : null;
    if (typeof m !== "string") continue;
    const igual = /^code=([a-z0-9_]+)$/.exec(m);
    if (igual) return igual[1];
    const dosPuntos = /^([a-z0-9_]+):/.exec(m);
    if (dosPuntos) return dosPuntos[1];
  }
  return null;
}

export function apperrorToDomainError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      const code = err.code === "ECONNABORTED" ? "timeout" : "network_error";
      return new DomainError(code, MENSAJES[code]);
    }
    const raw = err.response.data;
    const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const code =
      (typeof data.code === "string" && data.code) || codigoHuma(data) || `http_${err.response.status}`;
    const mensaje =
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.message === "string" && data.message) ||
      (typeof data.title === "string" && data.title) ||
      MENSAJES[code] ||
      "error del servidor";
    return new DomainError(code, mensaje);
  }
  if (err instanceof Error) return new DomainError("error_inesperado", err.message);
  return new DomainError("error_inesperado", String(err));
}

// Con responseType "blob" el cuerpo de error también llega como Blob; se lee
// (FileReader: jsdom no trae Blob.text) y se convierte a JSON para poder leer
// el código. Si no es JSON, se deja como está.
export async function normalizarErrorBlob(err: unknown): Promise<unknown> {
  if (!axios.isAxiosError(err) || !err.response || !(err.response.data instanceof Blob)) return err;
  const respuesta = err.response;
  const cuerpo = respuesta.data as Blob;
  try {
    const texto = await new Promise<string>((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result ?? ""));
      lector.onerror = () => reject(lector.error);
      lector.readAsText(cuerpo);
    });
    respuesta.data = JSON.parse(texto);
  } catch {
    // Cuerpo no JSON: se conserva el Blob y el código cae a http_<status>.
  }
  return err;
}
