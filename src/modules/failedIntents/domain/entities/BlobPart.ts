import type { BlobPartKind } from "../values/BlobPartKind";

// BlobPart is the parsed metadata for one section of a captured
// multipart upload. Field parts carry the decoded `value` bytes
// inline (text fields, JSON snippets); file parts carry only
// metadata — the bytes stream through the download endpoint on
// demand.
//
// Why this entity is read-only
// ────────────────────────────
// The reassembler API takes a manifest with *desired* parts (see
// ManifestPart), not edited BlobParts. The UI builds a Manifest from
// these as the user clicks keep / replace / remove. Treating the
// original parts as immutable makes the diff between original and
// edited trivial to compute.
export type BlobPart = {
  readonly index: number;
  readonly name: string | null;
  readonly kind: BlobPartKind;
  readonly contentType: string;
  readonly filename: string | null;
  readonly sizeBytes: number;
  // value is the decoded bytes for `field` parts. Null for `file`.
  // The backend wires this as base64; the mapper decodes once.
  readonly value: Uint8Array | null;
};

// BlobPartsBundle is what inspeccionarBlobParts returns: the parsed
// parts plus the original multipart Content-Type so the UI can show it.
export type BlobPartsBundle = {
  readonly contentType: string;
  readonly parts: ReadonlyArray<BlobPart>;
};
