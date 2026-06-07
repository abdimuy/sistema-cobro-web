import { DomainError } from "../errors";

const INTENT_STATUSES = [
  "new",
  "retried_ok",
  "retried_fail",
  "ignored",
  "resolved_manual",
] as const;

export type IntentStatusValue = (typeof INTENT_STATUSES)[number];

export class IntentStatus {
  private constructor(public readonly value: IntentStatusValue) {}

  static create(input: string): IntentStatus | DomainError {
    if ((INTENT_STATUSES as readonly string[]).includes(input)) {
      return new IntentStatus(input as IntentStatusValue);
    }
    return new DomainError(
      "intent_status_invalido",
      `estado de intento inválido: ${input}`,
    );
  }

  static values(): readonly IntentStatusValue[] {
    return INTENT_STATUSES;
  }

  isTerminal(): boolean {
    return this.value !== "new";
  }

  equals(other: IntentStatus): boolean {
    return this.value === other.value;
  }
}
