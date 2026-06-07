// UploadFile is the operator's contribution to a multipart replay: a
// brand-new file (or replacement for an existing one). The use case
// keys these by the manifest's `uploadField` reference so the adapter
// can match them when building the outgoing FormData.
export type UploadFile = {
  readonly file: File;
  // Optional override of the form-data filename; defaults to file.name.
  readonly filename?: string;
};

export type UploadMap = ReadonlyMap<string, UploadFile>;
