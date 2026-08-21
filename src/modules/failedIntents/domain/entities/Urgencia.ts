import { DomainError } from "../errors";
import type { Causa } from "./Causa";

// Urgencia es la pregunta que la pantalla contesta de un vistazo: ¿esto
// necesita a una persona, o se está arreglando solo?
//
// Sólo hay dos respuestas a propósito. Una escala de tres o cuatro niveles
// obliga a decidir dónde cae cada caso y termina en una columna de colores
// que nadie ordena; dos valores obligan a que cada renglón declare si alguien
// tiene que levantarse de la silla.
//
// Es función PURA de la Causa: misma causa, misma urgencia, siempre. Ni el
// número de intentos ni la antigüedad la mueven — una venta que lleva 13
// intentos por falta de inventario necesitaba a una persona desde el primero.
const URGENCIAS = ["necesita_accion", "se_reintenta"] as const;

export type UrgenciaValue = (typeof URGENCIAS)[number];

export class Urgencia {
  private constructor(public readonly value: UrgenciaValue) {}

  static create(input: string): Urgencia | DomainError {
    if ((URGENCIAS as readonly string[]).includes(input)) {
      return new Urgencia(input as UrgenciaValue);
    }
    return new DomainError("urgencia_invalida", `urgencia inválida: ${input}`);
  }

  static values(): readonly UrgenciaValue[] {
    return URGENCIAS;
  }

  static necesitaAccion(): Urgencia {
    return new Urgencia("necesita_accion");
  }

  static seReintenta(): Urgencia {
    return new Urgencia("se_reintenta");
  }

  // desde deriva la urgencia de la causa. Falta de inventario y cuerpo
  // rechazado necesitan a alguien: nadie repone stock ni corrige un campo por
  // reintentar. El resto —servidor caído, subida cortada, sin clasificar— se
  // cura solo en cuanto vuelva la conexión o el servidor.
  static desde(causa: Causa): Urgencia {
    return causa.necesitaPersona()
      ? new Urgencia("necesita_accion")
      : new Urgencia("se_reintenta");
  }

  necesitaAccion(): boolean {
    return this.value === "necesita_accion";
  }

  equals(other: Urgencia): boolean {
    return this.value === other.value;
  }
}
