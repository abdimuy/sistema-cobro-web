import { DomainError } from "../errors";

const REPLAY_OUTCOMES = ["retried_ok", "retried_fail"] as const;

export type ReplayOutcomeValue = (typeof REPLAY_OUTCOMES)[number];

export class ReplayOutcome {
  private constructor(public readonly value: ReplayOutcomeValue) {}

  static create(input: string): ReplayOutcome | DomainError {
    if ((REPLAY_OUTCOMES as readonly string[]).includes(input)) {
      return new ReplayOutcome(input as ReplayOutcomeValue);
    }
    return new DomainError(
      "replay_outcome_invalido",
      `resultado de replay inválido: ${input}`,
    );
  }

  isSuccess(): boolean {
    return this.value === "retried_ok";
  }
}
