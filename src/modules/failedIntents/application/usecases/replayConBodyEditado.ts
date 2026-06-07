import type { FailedIntent } from "../../domain/entities";
import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ReplayResult } from "../dto";
import { DomainError } from "../../domain/errors";

// replayConBodyEditado is the "replay-with corrections" use case.
//
// Backend invariant (mirrored here so the UI doesn't have to round-trip
// before it learns): multipart intents cannot replay-with. Their body
// lives in a blob the backend re-streams as-is on a plain replay. The
// /replay-with endpoint rejects them with apperror code
// `blob_intent_replay_with_unsupported`. We refuse the call early so
// the UI keeps the action disabled with a clear local error rather
// than a network round-trip.
export async function replayConBodyEditado(
  port: FailedIntentRepoPort,
  intent: FailedIntent,
  body: unknown,
): Promise<ReplayResult> {
  if (intent.hasBlob) {
    throw new DomainError(
      "blob_intent_replay_with_unsupported",
      "no se puede editar el body de un intento con archivos; usá Replay tal cual",
    );
  }
  if (body === undefined || body === null) {
    throw new DomainError(
      "replay_body_requerido",
      "el body corregido es obligatorio",
    );
  }
  return port.replayWith(intent.id, body);
}
