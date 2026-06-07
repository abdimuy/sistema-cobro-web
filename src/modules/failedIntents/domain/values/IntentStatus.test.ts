import { describe, expect, it } from "vitest";
import { IntentStatus } from "./IntentStatus";
import { DomainError } from "../errors";

describe("IntentStatus", () => {
  it("accepts each of the 5 backend statuses", () => {
    for (const s of IntentStatus.values()) {
      const v = IntentStatus.create(s);
      expect(v).toBeInstanceOf(IntentStatus);
      expect((v as IntentStatus).value).toBe(s);
    }
  });

  it("rejects any other string with a stable code", () => {
    const v = IntentStatus.create("retried_pending");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("intent_status_invalido");
  });

  it("rejects the empty string", () => {
    expect(IntentStatus.create("")).toBeInstanceOf(DomainError);
  });

  it("treats every status except `new` as terminal", () => {
    expect((IntentStatus.create("new") as IntentStatus).isTerminal()).toBe(false);
    for (const s of IntentStatus.values()) {
      if (s === "new") continue;
      const v = IntentStatus.create(s) as IntentStatus;
      expect(v.isTerminal()).toBe(true);
    }
  });

  it("equality compares by value", () => {
    const a = IntentStatus.create("new") as IntentStatus;
    const b = IntentStatus.create("new") as IntentStatus;
    const c = IntentStatus.create("ignored") as IntentStatus;
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
