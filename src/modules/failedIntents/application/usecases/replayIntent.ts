import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ReplayResult } from "../dto";
import { DomainError } from "../../domain/errors";

export async function replayIntent(
  port: FailedIntentRepoPort,
  intentId: string,
): Promise<ReplayResult> {
  if (!intentId || intentId.trim().length === 0) {
    throw new DomainError("intent_id_requerido", "el id del intento es obligatorio");
  }
  return port.replay(intentId);
}
