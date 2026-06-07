import { describe, expect, it } from "vitest";
import { inspeccionarBlobParts } from "./inspeccionarBlobParts";
import { FakeRepoPort } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";
import { BlobPartKind } from "../../domain/values/BlobPartKind";

describe("inspeccionarBlobParts", () => {
  it("forwards the intent id and returns the bundle", async () => {
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---xyz",
      parts: [
        {
          index: 0,
          name: "venta_json",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: 20,
          value: new Uint8Array([1, 2, 3]),
        },
      ],
    };

    const out = await inspeccincarMatching(port, "abc");
    expect(port.getBlobPartsCalls).toEqual([{ intentId: "abc" }]);
    expect(out.parts).toHaveLength(1);
    expect(out.parts[0].kind.isField()).toBe(true);
  });

  it("rejects empty id without touching the port", async () => {
    const port = new FakeRepoPort();
    await expect(inspeccionarBlobParts(port, "")).rejects.toBeInstanceOf(
      DomainError,
    );
    await expect(inspeccionarBlobParts(port, "  ")).rejects.toBeInstanceOf(
      DomainError,
    );
    expect(port.getBlobPartsCalls).toHaveLength(0);
  });

  it("propagates port errors", async () => {
    const port = new FakeRepoPort();
    const e = new DomainError("failed_intent_no_blob", "no es multipart");
    port.throwOnNext.getBlobParts = e;
    await expect(inspeccionarBlobParts(port, "abc")).rejects.toBe(e);
  });
});

// tiny indirection so a typo in the test name doesn't bleed visually
async function inspeccincarMatching(
  ...args: Parameters<typeof inspeccionarBlobParts>
) {
  return inspeccionarBlobParts(...args);
}
