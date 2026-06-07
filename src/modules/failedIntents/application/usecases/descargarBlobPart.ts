import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import { DomainError } from "../../domain/errors";

export async function descargarBlobPart(
  port: FailedIntentRepoPort,
  intentId: string,
  index: number,
  signal?: AbortSignal,
): Promise<Blob> {
  if (!intentId || intentId.trim().length === 0) {
    throw new DomainError(
      "intent_id_requerido",
      "el id del intento es obligatorio",
    );
  }
  if (!Number.isInteger(index) || index < 0) {
    throw new DomainError(
      "part_index_invalido",
      "el índice de la parte debe ser un entero no negativo",
    );
  }
  return port.downloadBlobPart(intentId, index, signal);
}
