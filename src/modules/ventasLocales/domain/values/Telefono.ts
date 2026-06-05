import { DomainError } from "../errors";

// E.164: +<country 1-3 digits><number 1-14 digits>, total 2-16 chars after +
// Legacy MX: exactly 10 digits
const E164_RE = /^\+[1-9]\d{1,14}$/;
const LEGACY_MX_RE = /^\d{10}$/;

export class Telefono {
  private constructor(public readonly value: string) {}

  static create(input: string): Telefono | DomainError {
    const trimmed = input.trim();
    if (E164_RE.test(trimmed) || LEGACY_MX_RE.test(trimmed)) {
      return new Telefono(trimmed);
    }
    return new DomainError("telefono_invalido", "el teléfono no tiene un formato válido (E.164 o 10 dígitos)");
  }
}
