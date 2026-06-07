import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { BlobPartsBundle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function inspeccionarBlobParts(
  port: FailedIntentRepoPort,
  intentId: string,
  signal?: AbortSignal,
): Promise<BlobPartsBundle> {
  if (!intentId || intentId.trim().length === 0) {
    throw new DomainError(
      "intent_id_requerido",
      "el id del intento es obligatorio",
    );
  }
  return port.getBlobParts(intentId, signal);
}
