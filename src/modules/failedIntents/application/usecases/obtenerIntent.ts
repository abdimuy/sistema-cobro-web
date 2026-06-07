import type { FailedIntent } from "../../domain/entities";
import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import { DomainError } from "../../domain/errors";

export async function obtenerIntent(
  port: FailedIntentRepoPort,
  intentId: string,
  signal?: AbortSignal,
): Promise<FailedIntent> {
  if (!intentId || intentId.trim().length === 0) {
    throw new DomainError("intent_id_requerido", "el id del intento es obligatorio");
  }
  return port.get(intentId, signal);
}
