import { describe, expect, it } from "vitest";
import { manifestToFormData } from "./manifestToFormData";
import type { Manifest } from "../../domain/entities";
import type { UploadMap } from "../../application/dto";

describe("manifestToFormData", () => {
  it("serializes the manifest JSON under __manifest and uploads as file fields", () => {
    const manifest: Manifest = [
      {
        name: "venta_json",
        contentType: "application/json",
        source: { kind: "field", value: new TextEncoder().encode(`{"x":1}`) },
      },
      {
        name: "ine",
        filename: "ine.jpg",
        source: { kind: "keep", originalIndex: 1 },
      },
      {
        name: "evidencia",
        source: { kind: "upload", uploadField: "file_0" },
      },
    ];
    const uploadFile = new File(["new bytes"], "firma.png", { type: "image/png" });
    const uploads: UploadMap = new Map([["file_0", { file: uploadFile }]]);

    const fd = manifestToFormData(manifest, uploads);

    const manifestStr = fd.get("__manifest");
    expect(typeof manifestStr).toBe("string");
    const parsed = JSON.parse(manifestStr as string);

    expect(parsed.parts).toHaveLength(3);
    expect(parsed.parts[0]).toMatchObject({
      name: "venta_json",
      content_type: "application/json",
    });
    expect(parsed.parts[0].source.kind).toBe("field");
    // base64 of `{"x":1}`
    expect(parsed.parts[0].source.value).toBe("eyJ4IjoxfQ==");

    expect(parsed.parts[1]).toMatchObject({
      name: "ine",
      filename: "ine.jpg",
    });
    expect(parsed.parts[1].source).toEqual({
      kind: "keep",
      original_index: 1,
    });

    expect(parsed.parts[2].source).toEqual({
      kind: "upload",
      upload_field: "file_0",
    });

    // The actual file rides as a separate form-data file part keyed by
    // the manifest's upload_field name.
    const file = fd.get("file_0");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("firma.png");
  });

  it("uses upload.filename override when present", () => {
    const manifest: Manifest = [
      {
        name: "x",
        source: { kind: "upload", uploadField: "u" },
      },
    ];
    const uploads: UploadMap = new Map([
      ["u", { file: new File([""], "default.jpg"), filename: "renamed.jpg" }],
    ]);
    const fd = manifestToFormData(manifest, uploads);
    const file = fd.get("u") as File;
    expect(file.name).toBe("renamed.jpg");
  });
});
