// Cursor is an opaque base64-encoded pointer the backend hands us in
// `next_cursor` and accepts back via the `?cursor=` query param. The frontend
// never inspects its contents — that's the whole point of an opaque cursor —
// so the VO simply guards against accidental misuse (empty string vs. unset).
import { DomainError } from "../errors";

export class Cursor {
  private constructor(public readonly value: string) {}

  static create(input: string): Cursor | DomainError {
    if (typeof input !== "string" || input.length === 0) {
      return new DomainError(
        "cursor_vacio",
        "cursor no puede ser vacío; usá `null` para indicar primera página",
      );
    }
    return new Cursor(input);
  }

  toString(): string {
    return this.value;
  }
}
