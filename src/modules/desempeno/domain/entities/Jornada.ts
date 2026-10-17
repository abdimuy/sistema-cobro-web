import type { Actividad } from "./Actividad";
import type { Conteo } from "./Conteo";
import type { Eje } from "./Tablero";
import type { LineaDelDia, ResumenPausas } from "./Linea";
import type { Senal } from "./Senal";

export type ResumenJornada = {
  readonly primeraActividad: string | null;
  readonly ultimaActividad: string | null;
  readonly minutosActivos: number;
  readonly pausas: ResumenPausas;
  readonly pagos: Conteo;
  readonly visitas: number;
  readonly condonaciones: Conteo;
  readonly clientes: number;
};

// Jornada: lo que registró ESTE usuario en un día (contrato §3). `generadoAt`
// (contrato v2) es la marca de "ahora" de la línea del día.
export type HorarioEco = { readonly desdeHora: string; readonly hastaHora: string };

export type Jornada = {
  readonly uid: string;
  readonly fecha: string;
  readonly pausaMin: number;
  readonly generadoAt: string;
  readonly hoy: string;
  readonly eje: Eje;
  readonly horario: HorarioEco | null;
  readonly actividades: readonly Actividad[];
  readonly linea: LineaDelDia;
  readonly senales: readonly Senal[];
  readonly resumen: ResumenJornada;
};
