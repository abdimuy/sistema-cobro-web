import { DomainError } from "../errors";

const BLOB_PART_KINDS = ["field", "file"] as const;

export type BlobPartKindValue = (typeof BLOB_PART_KINDS)[number];

export class BlobPartKind {
  private constructor(public readonly value: BlobPartKindValue) {}

  static create(input: string): BlobPartKind | DomainError {
    if ((BLOB_PART_KINDS as readonly string[]).includes(input)) {
      return new BlobPartKind(input as BlobPartKindValue);
    }
    return new DomainError(
      "blob_part_kind_invalido",
      `tipo de parte de blob inválido: ${input}`,
    );
  }

  static field(): BlobPartKind {
    return new BlobPartKind("field");
  }

  static file(): BlobPartKind {
    return new BlobPartKind("file");
  }

  isField(): boolean {
    return this.value === "field";
  }

  isFile(): boolean {
    return this.value === "file";
  }
}
