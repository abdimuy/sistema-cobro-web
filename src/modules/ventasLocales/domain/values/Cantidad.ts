import { DomainError } from "../errors";

export class Cantidad {
  private constructor(public readonly value: string) {}

  static create(input: string | number): Cantidad | DomainError {
    const str = typeof input === "number" ? String(input) : input.trim();
    const num = Number(str);
    if (isNaN(num) || !isFinite(num)) {
      return new DomainError("cantidad_invalida", "la cantidad no es un número válido");
    }
    if (num <= 0) {
      return new DomainError("cantidad_no_positiva", "la cantidad debe ser mayor a cero");
    }
    const dotIdx = str.indexOf(".");
    if (dotIdx !== -1 && str.length - dotIdx - 1 > 4) {
      return new DomainError("cantidad_demasiados_decimales", "la cantidad no puede tener más de 4 decimales");
    }
    const intPart = dotIdx !== -1 ? str.slice(0, dotIdx) : str;
    if (intPart.length > 10) {
      return new DomainError("cantidad_invalida", "la parte entera de la cantidad excede el máximo permitido");
    }
    return new Cantidad(str);
  }

  static one(): Cantidad {
    return new Cantidad("1");
  }

  toV2String(): string {
    return this.value;
  }

  toNumber(): number {
    return parseFloat(this.value);
  }
}
