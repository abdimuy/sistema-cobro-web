import { DomainError } from "../errors";
import type { Cantidad } from "./Cantidad";

export class Monto {
  private constructor(public readonly value: string) {}

  static create(input: string | number): Monto | DomainError {
    const str = typeof input === "number" ? String(input) : input.trim();
    const num = Number(str);
    if (isNaN(num) || !isFinite(num)) {
      return new DomainError("monto_invalido", "el monto no es un número válido");
    }
    if (num < 0) {
      return new DomainError("monto_negativo", "el monto no puede ser negativo");
    }
    // Check fractional digits by inspecting the string representation
    const dotIdx = str.indexOf(".");
    if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
      return new DomainError("monto_demasiados_decimales", "el monto no puede tener más de 2 decimales");
    }
    // Check integer part (<= 12 digits)
    const intPart = dotIdx !== -1 ? str.slice(0, dotIdx) : str;
    const intDigits = intPart.replace(/^-/, "");
    if (intDigits.length > 12) {
      return new DomainError("monto_invalido", "la parte entera del monto excede el máximo permitido");
    }
    return new Monto(Monto._normalize(num));
  }

  static zero(): Monto {
    return new Monto("0.00");
  }

  private static _normalize(num: number): string {
    return num.toFixed(2);
  }

  private _toCents(): number {
    return Math.round(parseFloat(this.value) * 100);
  }

  add(other: Monto): Monto {
    const cents = this._toCents() + other._toCents();
    return new Monto((cents / 100).toFixed(2));
  }

  times(cantidad: Cantidad): Monto {
    // Multiply and round to 2 decimals using standard HALF_UP rounding
    const result = parseFloat(this.value) * parseFloat(cantidad.value);
    return new Monto((Math.round(result * 100) / 100).toFixed(2));
  }

  toV2String(): string {
    return this.value;
  }

  toNumber(): number {
    return parseFloat(this.value);
  }
}
