// Manifest is the wire-shape-mirror of the backend's
// failedintent.ReassembleInput.Parts — what the UI sends back to
// describe the desired final multipart body.
//
// Each part picks a source: keep the original bytes by index, inline a
// new value, or reference an upload that ships alongside in the same
// FormData. The adapter handles the base64-encoding of `field` values
// and the actual FormData construction.

export type ManifestSource =
  | { kind: "keep"; originalIndex: number }
  | { kind: "field"; value: Uint8Array }
  | { kind: "upload"; uploadField: string };

export type ManifestPart = {
  readonly name: string;
  readonly contentType?: string;
  readonly filename?: string;
  readonly source: ManifestSource;
};

export type Manifest = ReadonlyArray<ManifestPart>;
