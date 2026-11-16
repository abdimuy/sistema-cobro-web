import axios from "axios";

export function mensajeErrorGarantias(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? "El servidor tardó demasiado en responder."
        : "No hay conexión con el servidor.";
    }

    const raw = error.response.data;

    if (raw && typeof raw === "object") {
      const data = raw as Record<string, unknown>;

      for (const campo of ["detail", "message", "title"]) {
        const valor = data[campo];

        if (typeof valor === "string" && valor.trim()) {
          return valor.trim();
        }
      }
    }

    switch (error.response.status) {
      case 403:
        return "No tienes permiso para realizar esta operación.";
      case 409:
        return "La operación entra en conflicto con el estado actual.";
      case 422:
        return "La operación no cumple las reglas de la garantía.";
      default:
        return `No se pudo completar la operación (HTTP ${error.response.status}).`;
    }
  }

  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}
