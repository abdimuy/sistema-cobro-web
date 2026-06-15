import { describe, expect, it } from "vitest";
import { Tier } from "./Tier";
import { DomainError } from "../errors";

describe("Tier", () => {
  it("accepts each of the 4 valid tiers", () => {
    for (const t of Tier.values()) {
      const v = Tier.create(t);
      expect(v).toBeInstanceOf(Tier);
      expect((v as Tier).value).toBe(t);
    }
  });

  it("rejects an unknown string with a stable code", () => {
    const v = Tier.create("E");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("tier_invalido");
  });

  it("rejects the empty string", () => {
    expect(Tier.create("")).toBeInstanceOf(DomainError);
  });

  it("rejects lowercase tier letters", () => {
    const v = Tier.create("a");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("tier_invalido");
  });

  it("error message contains the invalid input", () => {
    const v = Tier.create("Z") as DomainError;
    expect(v.message).toContain("Z");
  });

  it("equality compares by value", () => {
    const a = Tier.create("A") as Tier;
    const b = Tier.create("A") as Tier;
    const c = Tier.create("C") as Tier;
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
