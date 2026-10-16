import axios, { AxiosError } from "axios";
import { DomainError } from "../../domain/errors";
import { conLineaRechazada } from "@/lib/lineaRechazada";
import { codigoDeError } from "@/lib/codigoDeError";

export function mapAxiosError(err: unknown): DomainError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data as Record<string, unknown> | undefined;

    // Try to extract a backend-supplied code first.
    const code =
      codigoDeError(data) ||
      (ax.code === "ECONNABORTED" ? "timeout" : null) ||
      (ax.message?.toLowerCase().includes("network") ? "network_error" : null) ||
      `http_${ax.response?.status ?? "error"}`;

    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.title === "string" && data.title) ||
      ax.message ||
      "error de red";

    return new DomainError(code, conLineaRechazada(message, data));
  }
  if (err instanceof DomainError) return err;
  if (err instanceof Error) return new DomainError("error_inesperado", err.message);
  return new DomainError("error_inesperado", String(err));
}
