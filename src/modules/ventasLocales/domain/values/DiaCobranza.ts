import { DomainError } from "../errors";

export type DiaSemana =
  | "LUNES"
  | "MARTES"
  | "MIERCOLES"
  | "JUEVES"
  | "VIERNES"
  | "SABADO"
  | "DOMINGO";

const DIAS_SEMANA: ReadonlySet<string> = new Set<DiaSemana>([
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
]);

export type DiaCobranza =
  | { kind: "semana"; dia: DiaSemana }
  | { kind: "mes"; dia: number };

export const DiaCobranza = {
  semana(dia: string): DiaCobranza | DomainError {
    if (!DIAS_SEMANA.has(dia)) {
      return new DomainError("dia_semana_invalido", "el día de cobranza semanal no es válido");
    }
    return { kind: "semana", dia: dia as DiaSemana };
  },

  mes(dia: number): DiaCobranza | DomainError {
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      return new DomainError("dia_mes_fuera_de_rango", "el día del mes de cobranza debe estar entre 1 y 31");
    }
    return { kind: "mes", dia };
  },
};
