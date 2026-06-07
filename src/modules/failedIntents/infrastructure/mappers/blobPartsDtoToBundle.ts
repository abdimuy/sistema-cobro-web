import type { BlobPart, BlobPartsBundle } from "../../domain/entities";
import { BlobPartKind } from "../../domain/values/BlobPartKind";
import { DomainError } from "../../domain/errors";

export type BlobPartDTO = {
  index: number;
  name?: string;
  kind: string;
  content_type: string;
  filename?: string;
  size_bytes: number;
  // base64 of the field's bytes, only present when kind === "field".
  value?: string;
};

export type BlobPartsResponseDTO = {
  content_type: string;
  parts: BlobPartDTO[];
};

export function blobPartsDtoToBundle(
  dto: BlobPartsResponseDTO,
): BlobPartsBundle {
  return {
    contentType: dto.content_type,
    parts: dto.parts.map(blobPartDtoToDomain),
  };
}

function blobPartDtoToDomain(dto: BlobPartDTO): BlobPart {
  const kind = BlobPartKind.create(dto.kind);
  if (kind instanceof DomainError) throw kind;

  let value: Uint8Array | null = null;
  if (kind.isField() && dto.value) {
    value = base64ToBytes(dto.value);
  }

  return {
    index: dto.index,
    name: dto.name ?? null,
    kind,
    contentType: dto.content_type,
    filename: dto.filename ?? null,
    sizeBytes: dto.size_bytes,
    value,
  };
}

// base64ToBytes decodes a standard-base64 string into raw bytes. We avoid
// atob() in node-test environments by handling both browser and node.
function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Node / jsdom fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = (globalThis as any).Buffer?.from(b64, "base64");
  if (buf) return new Uint8Array(buf);
  throw new DomainError("base64_decode_unavailable", "no se puede decodificar base64");
}
