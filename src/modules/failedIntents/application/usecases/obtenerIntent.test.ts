import { describe, expect, it } from "vitest";
import { obtenerIntent } from "./obtenerIntent";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";

describe("obtenerIntent", () => {
  it("forwards the id and returns the entity", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ id: "abc" });
    port.getResponse = intent;

    const out = await obtenerIntent(port, "abc");
    expect(port.getCalls).toEqual([{ intentId: "abc" }]);
    expect(out).toBe(intent);
  });

  it("rejects empty id without touching the port", async () => {
    const port = new FakeRepoPort();
    await expect(obtenerIntent(port, "")).rejects.toBeInstanceOf(DomainError);
    await expect(obtenerIntent(port, "   ")).rejects.toBeInstanceOf(DomainError);
    expect(port.getCalls).toHaveLength(0);
  });
});
