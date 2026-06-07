import { describe, expect, it } from "vitest";
import { ReplayOutcome } from "./ReplayOutcome";
import { DomainError } from "../errors";

describe("ReplayOutcome", () => {
  it("accepts retried_ok / retried_fail", () => {
    expect((ReplayOutcome.create("retried_ok") as ReplayOutcome).value).toBe(
      "retried_ok",
    );
    expect((ReplayOutcome.create("retried_fail") as ReplayOutcome).value).toBe(
      "retried_fail",
    );
  });

  it("rejects any other status — even statuses that are valid for IntentStatus", () => {
    for (const v of ["new", "ignored", "resolved_manual", "garbage"]) {
      const r = ReplayOutcome.create(v);
      expect(r).toBeInstanceOf(DomainError);
      expect((r as DomainError).code).toBe("replay_outcome_invalido");
    }
  });

  it("isSuccess() distinguishes the two outcomes", () => {
    expect((ReplayOutcome.create("retried_ok") as ReplayOutcome).isSuccess()).toBe(
      true,
    );
    expect(
      (ReplayOutcome.create("retried_fail") as ReplayOutcome).isSuccess(),
    ).toBe(false);
  });
});
