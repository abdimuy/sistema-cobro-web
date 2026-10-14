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

// D7: el umbral y el horario van en la consulta, no se guardan como configuración.
export const UMBRALES_PAUSA = [15, 30, 45, 60, 90] as const;
export const PAUSA_MIN_PREDETERMINADA = 45;
export const HORARIO_PREDETERMINADO: Horario = { desde: "08:00", hasta: "18:00" };

export function esVistaLinea(v: unknown): v is VistaLinea {
  return typeof v === "string" && (VISTAS_LINEA as readonly string[]).includes(v);
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
