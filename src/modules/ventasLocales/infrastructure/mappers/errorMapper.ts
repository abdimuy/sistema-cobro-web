import axios, { AxiosError } from "axios";
import { DomainError } from "../../domain/errors";

export function mapAxiosError(err: unknown): DomainError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data as Record<string, unknown> | undefined;

    // Try to extract a backend-supplied code first.
    const code =
      (typeof data?.code === "string" && data.code) ||
      // Huma RFC 7807 errors put the title in "title" and details under "errors":
      extractCodeFromHuma(data) ||
      (ax.code === "ECONNABORTED" ? "timeout" : null) ||
      (ax.message?.toLowerCase().includes("network") ? "network_error" : null) ||
      `http_${ax.response?.status ?? "error"}`;

    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.title === "string" && data.title) ||
      ax.message ||
      "error de red";

    return new DomainError(code, message);
  }
  if (err instanceof DomainError) return err;
  if (err instanceof Error) return new DomainError("error_inesperado", err.message);
  return new DomainError("error_inesperado", String(err));
}

function extractCodeFromHuma(data: Record<string, unknown> | undefined): string | null {
  // Huma errors: { errors: [ { message: "code: human message" } ] }
  if (!data || !Array.isArray(data.errors)) return null;
  for (const e of data.errors) {
    if (e && typeof e === "object" && typeof (e as { message?: unknown }).message === "string") {
      const m = (e as { message: string }).message;
      const colonIdx = m.indexOf(":");
      if (colonIdx > 0 && /^[a-z_]+$/.test(m.slice(0, colonIdx))) {
        return m.slice(0, colonIdx);
      }
    }
  }
  return null;
}
