import { describe, expect, it } from "vitest";
import { descargarBlobPart } from "./descargarBlobPart";
import { FakeRepoPort } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";

describe("descargarBlobPart", () => {
  it("forwards id + index and returns the Blob", async () => {
    const port = new FakeRepoPort();
    const blob = new Blob(["x"], { type: "image/jpeg" });
    port.downloadBlobPartResponse = blob;

    const out = await descargarBlobPart(port, "abc", 2);
    expect(port.downloadBlobPartCalls).toEqual([{ intentId: "abc", index: 2 }]);
    expect(out).toBe(blob);
  });

  it("rejects negative index", async () => {
    const port = new FakeRepoPort();
    await expect(
      descargarBlobPart(port, "abc", -1),
    ).rejects.toBeInstanceOf(DomainError);
    expect(port.downloadBlobPartCalls).toHaveLength(0);
  });

  it("rejects fractional index", async () => {
    const port = new FakeRepoPort();
    await expect(
      descargarBlobPart(port, "abc", 1.5),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects empty id", async () => {
    const port = new FakeRepoPort();
    await expect(descargarBlobPart(port, "", 0)).rejects.toBeInstanceOf(
      DomainError,
    );
  });
});
