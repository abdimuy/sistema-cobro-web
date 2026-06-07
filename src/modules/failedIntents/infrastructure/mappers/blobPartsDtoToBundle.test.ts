import { describe, expect, it } from "vitest";
import { blobPartsDtoToBundle } from "./blobPartsDtoToBundle";
import { DomainError } from "../../domain/errors";

const sampleField = {
  index: 0,
  name: "venta_json",
  kind: "field",
  content_type: "application/json",
  size_bytes: 20,
  // base64 of `{"a":1}`
  value: "eyJhIjoxfQ==",
};

const sampleFile = {
  index: 1,
  name: "ine",
  kind: "file",
  content_type: "image/jpeg",
  filename: "ine.jpg",
  size_bytes: 1500,
};

describe("blobPartsDtoToBundle", () => {
  it("maps field parts and decodes base64 into Uint8Array", () => {
    const bundle = blobPartsDtoToBundle({
      content_type: "multipart/form-data; boundary=---x",
      parts: [sampleField],
    });
    expect(bundle.contentType).toBe("multipart/form-data; boundary=---x");
    expect(bundle.parts).toHaveLength(1);
    const part = bundle.parts[0];
    expect(part.name).toBe("venta_json");
    expect(part.kind.isField()).toBe(true);
    expect(part.value).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(part.value!)).toBe(`{"a":1}`);
  });

  it("maps file parts without inlining bytes", () => {
    const bundle = blobPartsDtoToBundle({
      content_type: "multipart/form-data; boundary=---x",
      parts: [sampleFile],
    });
    const part = bundle.parts[0];
    expect(part.kind.isFile()).toBe(true);
    expect(part.filename).toBe("ine.jpg");
    expect(part.sizeBytes).toBe(1500);
    expect(part.value).toBeNull();
  });

  it("throws DomainError for unknown kind", () => {
    expect(() =>
      blobPartsDtoToBundle({
        content_type: "x",
        parts: [{ ...sampleField, kind: "garbage" }],
      }),
    ).toThrowError(DomainError);
  });

  it("normalizes missing name/filename to null", () => {
    const bundle = blobPartsDtoToBundle({
      content_type: "x",
      parts: [
        {
          index: 0,
          kind: "field",
          content_type: "text/plain",
          size_bytes: 0,
          value: "",
        },
      ],
    });
    expect(bundle.parts[0].name).toBeNull();
    expect(bundle.parts[0].filename).toBeNull();
  });
});
