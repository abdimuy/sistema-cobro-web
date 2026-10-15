import type { Periodo } from "../domain/entities";
import type {
  ConsultaJornada,
  ConsultaTablero,
  Horario,
} from "../application/ports/DesempenoPort";

// D16: cada quien elige cómo ver la línea; se recuerda por computadora.
export const VISTAS_LINEA = ["puntos", "bloques", "por_hora", "bloques_hora"] as const;
export type VistaLinea = (typeof VISTAS_LINEA)[number];
export const VISTA_LINEA_PREDETERMINADA: VistaLinea = "bloques";
export const CLAVE_VISTA_LINEA = "desempeno.vista-linea";

// D7: el umbral y el horario van en la consulta, no se guardan como configuración
// del servidor. El umbral se recuerda por computadora y acepta cualquier entero
// del contrato (`pausa_min` 5–240); UMBRALES_PAUSA son solo los botones rápidos.
export const UMBRALES_PAUSA = [15, 30, 45, 60, 90] as const;
export const PAUSA_MIN_PREDETERMINADA = 45;
export const PAUSA_MIN_MINIMA = 5;
export const PAUSA_MIN_MAXIMA = 240;
export const PASO_PAUSA_MIN = 5;
export const CLAVE_PAUSA_MIN = "desempeno.pausa-min";
export const HORARIO_PREDETERMINADO: Horario = { desde: "08:00", hasta: "18:00" };

export function esVistaLinea(v: unknown): v is VistaLinea {
  return typeof v === "string" && (VISTAS_LINEA as readonly string[]).includes(v);
}

export function esPausaMinValida(v: unknown): v is number {
  return (
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= PAUSA_MIN_MINIMA &&
    v <= PAUSA_MIN_MAXIMA
  );
}

export type PreferenciasDesempeno = {
  periodo: Periodo;
  pausaMin: number;
  horario: Horario | null;
  vista: VistaLinea;
};

export type ValorPreferencias = PreferenciasDesempeno & {
  consultaJornada: ConsultaJornada;
  consultaTablero: ConsultaTablero;
  setPeriodo: (p: Periodo) => void;
  setPausaMin: (m: number) => void;
  setHorario: (h: Horario | null) => void;
  setVista: (v: VistaLinea) => void;
};
