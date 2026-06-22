// DomainError mirrors the apperror convention from the backend:
// a stable machine-readable `code` plus a human Spanish `message`.
// The module's UI maps known backend codes to friendlier messages via
// the infrastructure layer.
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "DomainError";
  }
}
