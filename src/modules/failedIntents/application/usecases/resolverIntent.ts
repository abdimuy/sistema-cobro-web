import type { FailedIntent } from "../../domain/entities";
import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ResolveInput } from "../dto";
import { DomainError } from "../../domain/errors";

// NOTES_MAX_RUNES mirrors the backend cap (handlers_test.go:
// TestResolver_NotesTooLong_Returns422). We count runes via the spread
// iterator so surrogate pairs (emojis, CJK) count as one — matching the
// backend's `utf8.RuneCountInString` semantics.
const NOTES_MAX_RUNES = 500;

const VALID_STATUSES: ReadonlyArray<ResolveInput["status"]> = [
  "ignored",
  "resolved_manual",
];

export async function resolverIntent(
  port: FailedIntentRepoPort,
  input: ResolveInput,
): Promise<FailedIntent> {
  if (!input.intentId || input.intentId.trim().length === 0) {
    throw new DomainError("intent_id_requerido", "el id del intento es obligatorio");
  }
  if (!VALID_STATUSES.includes(input.status)) {
    throw new DomainError(
      "invalid_resolve_status",
      `el estado ${input.status} no es válido para resolver manualmente`,
    );
  }
  const runeCount = [...(input.notes ?? "")].length;
  if (runeCount > NOTES_MAX_RUNES) {
    throw new DomainError(
      "notes_too_long",
      `las notas no pueden exceder ${NOTES_MAX_RUNES} caracteres`,
    );
  }
  return port.resolve(input);
}
