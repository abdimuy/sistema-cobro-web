import { DomainError } from "../errors";

const TIERS = ["A", "B", "C", "D"] as const;

export type TierValue = (typeof TIERS)[number];

export class Tier {
  private constructor(public readonly value: TierValue) {}

  static create(input: string): Tier | DomainError {
    if ((TIERS as readonly string[]).includes(input)) {
      return new Tier(input as TierValue);
    }
    return new DomainError(
      "tier_invalido",
      `tier inválido: ${input}`,
    );
  }

  static values(): readonly TierValue[] {
    return TIERS;
  }

  equals(other: Tier): boolean {
    return this.value === other.value;
  }
}
