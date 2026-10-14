import type { TipoActividad } from "./Actividad";
import type { Conteo } from "./Conteo";

// PuntoLinea: un punto del eje. Trae lo justo para su popover (contrato v2):
// `importe` es null en visitas y `resultado` (literal de tipo de visita) es
// null en pagos y condonaciones.
export type PuntoLinea = {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly hora: string;
  readonly clienteNombre: string;
  readonly importe: string | null;
  readonly resultado: string | null;
  readonly numFotos: number;
};

// Pausa: hueco ≥ pausa_min entre dos actividades (lo calcula el servidor).
export type Pausa = {
  readonly desde: string;
  readonly hasta: string;
  readonly minutos: number;
  readonly anteriorId: string | null;
  readonly siguienteId: string | null;
  readonly enCurso: boolean;
};

// Tramo: bloque continuo de trabajo (vista Bloques).
export type Tramo = {
  readonly desde: string;
  readonly hasta: string;
  readonly pagos: Conteo;
  readonly visitas: number;
  readonly condonaciones: number;
  readonly clientes: number;
};

// HoraDelDia: una entrada por hora 7..19, intervalo [h, h+1) (vista Por hora).
export type HoraDelDia = {
  readonly hora: number;
  readonly pagos: number;
  readonly visitas: number;
  readonly condonaciones: number;
  readonly importe: string;
};

export type LineaDelDia = {
  readonly dia: string;
  readonly puntos: readonly PuntoLinea[];
  readonly tramos: readonly Tramo[];
  readonly porHora: readonly HoraDelDia[];
  readonly pausas: readonly Pausa[];
};

export type ResumenPausas = {
  readonly n: number;
  readonly minutos: number;
  readonly enCurso: boolean;
};
