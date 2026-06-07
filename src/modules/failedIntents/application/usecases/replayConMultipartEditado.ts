import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ReplayResult, UploadMap } from "../dto";
import type { Manifest, FailedIntent } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

// replayConMultipartEditado is the "replay-with corrections" use case for
// multipart intents. The caller (the unified ReplayWithSheet) hands over:
//
//   • the intent whose blob is being edited (so the guards run client-side
//     instead of after a wasted round-trip),
//   • the manifest describing the desired final body part by part, and
//   • a map of upload bytes keyed by manifest's `uploadField`.
//
// Backend invariant guards:
//   • intent must be a multipart capture (hasBlob === true). If a caller
//     somehow asks for this use case on a JSON intent, the backend would
//     reject with failed_intent_no_blob, but we refuse early.
//   • the manifest must reference every UploadField present in the map
//     (no orphan uploads) AND every kind:upload entry in the manifest
//     must have its uploadField present in the map (no dangling refs).
//   • the manifest cannot be empty — produces an empty body the
//     backend would 400 on.
export async function replayConMultipartEditado(
  port: FailedIntentRepoPort,
  intent: FailedIntent,
  manifest: Manifest,
  uploads: UploadMap,
): Promise<ReplayResult> {
  if (!intent.hasBlob) {
    throw new DomainError(
      "intent_not_multipart",
      "este intento no es multipart; usá replay con body JSON",
    );
  }
  if (manifest.length === 0) {
    throw new DomainError(
      "replay_manifest_empty",
      "el manifest no puede estar vacío",
    );
  }
  validateManifestUploadsMatch(manifest, uploads);
  return port.replayWithMultipart(intent.id, manifest, uploads);
}

function validateManifestUploadsMatch(
  manifest: Manifest,
  uploads: UploadMap,
): void {
  const referenced = new Set<string>();
  for (const [i, part] of manifest.entries()) {
    if (!part.name || part.name.trim().length === 0) {
      throw new DomainError(
        "manifest_part_name_required",
        `la parte ${i} del manifest necesita un nombre`,
      );
    }
    if (part.source.kind === "upload") {
      if (!part.source.uploadField) {
        throw new DomainError(
          "manifest_upload_field_required",
          `la parte ${i} del manifest necesita un upload_field`,
        );
      }
      if (!uploads.has(part.source.uploadField)) {
        throw new DomainError(
          "manifest_upload_missing",
          `falta el archivo para upload_field=${part.source.uploadField}`,
        );
      }
      referenced.add(part.source.uploadField);
    }
  }
  // Reject orphan uploads — the operator might have queued a file the
  // manifest doesn't consume; better to surface that than silently drop.
  for (const key of uploads.keys()) {
    if (!referenced.has(key)) {
      throw new DomainError(
        "manifest_upload_orphan",
        `el archivo ${key} no está referenciado en el manifest`,
      );
    }
  }
}
