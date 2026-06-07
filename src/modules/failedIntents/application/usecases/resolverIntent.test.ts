import { describe, expect, it } from "vitest";
import { resolverIntent } from "./resolverIntent";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";
import { IntentStatus } from "../../domain/values";

describe("resolverIntent", () => {
  it("delegates to port.resolve for `ignored`", async () => {
    const port = new FakeRepoPort();
    port.resolveResponse = makeFakeIntent({
      status: IntentStatus.create("ignored") as IntentStatus,
      notes: "duplicado",
    });

    const out = await resolverIntent(port, {
      intentId: "abc",
      status: "ignored",
      notes: "duplicado",
    });

    expect(port.resolveCalls[0].input).toEqual({
      intentId: "abc",
      status: "ignored",
      notes: "duplicado",
    });
    expect(out.status.value).toBe("ignored");
  });

  it("delegates to port.resolve for `resolved_manual`", async () => {
    const port = new FakeRepoPort();
    await resolverIntent(port, {
      intentId: "abc",
      status: "resolved_manual",
      notes: "arreglado fuera del sistema",
    });
    expect(port.resolveCalls[0].input.status).toBe("resolved_manual");
  });

  it("rejects any status that isn't ignored/resolved_manual", async () => {
    const port = new FakeRepoPort();
    // `retried_ok` is a valid IntentStatus but not a valid resolve target.
    const err = resolverIntent(port, {
      intentId: "abc",
      status: "retried_ok" as never,
      notes: "",
    });
    await expect(err).rejects.toMatchObject({
      code: "invalid_resolve_status",
    });
    expect(port.resolveCalls).toHaveLength(0);
  });

  it("rejects notes over 500 runes — surrogate-aware count", async () => {
    const port = new FakeRepoPort();
    // 501 runes — one over the cap.
    const notes = "a".repeat(501);
    const err = resolverIntent(port, {
      intentId: "abc",
      status: "ignored",
      notes,
    });
    await expect(err).rejects.toMatchObject({ code: "notes_too_long" });
  });

  it("counts emojis as one rune (matches backend utf8.RuneCountInString)", async () => {
    const port = new FakeRepoPort();
    // 500 emoji = 500 runes — exactly at the cap, must pass.
    const notes = "🚀".repeat(500);
    await expect(
      resolverIntent(port, { intentId: "abc", status: "ignored", notes }),
    ).resolves.toBeTruthy();
  });

  it("rejects empty intent id", async () => {
    const port = new FakeRepoPort();
    await expect(
      resolverIntent(port, { intentId: "", status: "ignored", notes: "" }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors", async () => {
    const port = new FakeRepoPort();
    const e = new DomainError(
      "failed_intent_status_conflict",
      "el estado del intento no coincide",
    );
    port.throwOnNext.resolve = e;
    await expect(
      resolverIntent(port, {
        intentId: "abc",
        status: "ignored",
        notes: "",
      }),
    ).rejects.toBe(e);
  });
});
