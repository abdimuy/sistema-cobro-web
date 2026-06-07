import { describe, expect, it } from "vitest";
import { BlobPartKind } from "./BlobPartKind";
import { DomainError } from "../errors";

describe("BlobPartKind", () => {
  it("accepts field and file", () => {
    expect((BlobPartKind.create("field") as BlobPartKind).value).toBe("field");
    expect((BlobPartKind.create("file") as BlobPartKind).value).toBe("file");
  });

  it("rejects anything else", () => {
    expect(BlobPartKind.create("blob")).toBeInstanceOf(DomainError);
    expect(BlobPartKind.create("")).toBeInstanceOf(DomainError);
  });

  it("isField / isFile narrow correctly", () => {
    expect(BlobPartKind.field().isField()).toBe(true);
    expect(BlobPartKind.field().isFile()).toBe(false);
    expect(BlobPartKind.file().isFile()).toBe(true);
    expect(BlobPartKind.file().isField()).toBe(false);
  });
});
