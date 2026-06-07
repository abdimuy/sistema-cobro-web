import type { Manifest } from "../../domain/entities";
import type { UploadMap } from "../../application/dto";

// manifestToFormData builds the outgoing multipart body for
// POST /:id/replay-with-multipart. Three sections per part shape:
//
//   • field → manifest carries the bytes inline as base64
//   • keep  → only the original_index travels (backend re-reads the blob)
//   • upload → manifest carries only the upload_field reference; the
//     actual bytes are appended as separate file form fields with the
//     same name.
//
// The function encodes field values to base64 — the backend's
// manifestSourceDTO.Value is base64 too, so the wire shape stays
// symmetric.
export function manifestToFormData(
  manifest: Manifest,
  uploads: UploadMap,
): FormData {
  const fd = new FormData();
  const manifestWire = {
    parts: manifest.map((p) => {
      const part: Record<string, unknown> = { name: p.name };
      if (p.contentType) part.content_type = p.contentType;
      if (p.filename) part.filename = p.filename;
      switch (p.source.kind) {
        case "keep":
          part.source = {
            kind: "keep",
            original_index: p.source.originalIndex,
          };
          break;
        case "field":
          part.source = {
            kind: "field",
            value: bytesToBase64(p.source.value),
          };
          break;
        case "upload":
          part.source = {
            kind: "upload",
            upload_field: p.source.uploadField,
          };
          break;
      }
      return part;
    }),
  };
  fd.append("__manifest", JSON.stringify(manifestWire));

  for (const [uploadField, upload] of uploads) {
    const filename = upload.filename ?? upload.file.name;
    fd.append(uploadField, upload.file, filename);
  }

  return fd;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = (globalThis as any).Buffer?.from(bytes);
  if (buf) return buf.toString("base64");
  throw new Error("base64_encode_unavailable");
}
