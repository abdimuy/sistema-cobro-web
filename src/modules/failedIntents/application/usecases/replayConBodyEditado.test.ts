import { describe, expect, it } from "vitest";
import { replayConBodyEditado } from "./replayConBodyEditado";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";

describe("replayConBodyEditado", () => {
  it("calls port.replayWith with the corrected body for JSON intents", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: false });
    const body = { cliente: "FIXED" };

    await replayConBodyEditado(port, intent, body);

    expect(port.replayWithCalls).toEqual([
      { intentId: intent.id, body },
    ]);
  });

  it("refuses to call the port for multipart (blob) intents — UI guard mirror", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });

    const err = replayConBodyEditado(port, intent, { cliente: "X" });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({
      code: "blob_intent_replay_with_unsupported",
    });
    expect(port.replayWithCalls).toHaveLength(0);
  });

  it("refuses when body is null or undefined", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: false });
    await expect(replayConBodyEditado(port, intent, null)).rejects.toBeInstanceOf(
      DomainError,
    );
    await expect(
      replayConBodyEditado(port, intent, undefined),
    ).rejects.toBeInstanceOf(DomainError);
    expect(port.replayWithCalls).toHaveLength(0);
  });

  it("propagates port errors", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: false });
    const e = new DomainError("intent_has_no_usuario", "intento sin vendedor");
    port.throwOnNext.replayWith = e;
    await expect(replayConBodyEditado(port, intent, {})).rejects.toBe(e);
  });
});
