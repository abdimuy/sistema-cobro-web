import { describe, expect, it } from "vitest";
import { replayIntent } from "./replayIntent";
import { FakeRepoPort } from "../__tests__/fakeRepoPort";
import { ReplayOutcome } from "../../domain/values";
import { DomainError } from "../../domain/errors";

describe("replayIntent", () => {
  it("delegates to port.replay and returns the outcome", async () => {
    const port = new FakeRepoPort();
    port.replayResponse = {
      outcome: ReplayOutcome.create("retried_ok") as ReplayOutcome,
      replayHttpStatus: 201,
      replayBodyPreview: '{"ok":true}',
    };

    const out = await replayIntent(port, "abc");
    expect(port.replayCalls).toEqual([{ intentId: "abc" }]);
    expect(out.outcome.isSuccess()).toBe(true);
    expect(out.replayHttpStatus).toBe(201);
  });

  it("surfaces retried_fail from the backend", async () => {
    const port = new FakeRepoPort();
    port.replayResponse = {
      outcome: ReplayOutcome.create("retried_fail") as ReplayOutcome,
      replayHttpStatus: 422,
      replayBodyPreview: '{"code":"validation"}',
    };
    const out = await replayIntent(port, "abc");
    expect(out.outcome.isSuccess()).toBe(false);
    expect(out.replayHttpStatus).toBe(422);
  });

  it("rejects empty intent id", async () => {
    const port = new FakeRepoPort();
    await expect(replayIntent(port, "")).rejects.toBeInstanceOf(DomainError);
    expect(port.replayCalls).toHaveLength(0);
  });

  it("propagates port errors", async () => {
    const port = new FakeRepoPort();
    const e = new DomainError("user_inactive", "vendedor inactivo");
    port.throwOnNext.replay = e;
    await expect(replayIntent(port, "abc")).rejects.toBe(e);
  });
});
