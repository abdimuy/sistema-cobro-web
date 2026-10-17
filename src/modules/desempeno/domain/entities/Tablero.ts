import { esUno } from "../values/esUno";
import type { TipoActividad } from "./Actividad";
import type { Conteo } from "./Conteo";
import type { LineaDelDia, ResumenPausas } from "./Linea";

export const PERIODOS = ["hoy", "semana"] as const;
export type Periodo = (typeof PERIODOS)[number];
export const esPeriodo = (v: unknown): v is Periodo => esUno(PERIODOS, v);

export const ESTADOS_AHORA = ["activo", "sin_actividad", "no_ha_empezado"] as const;
export type EstadoAhora = (typeof ESTADOS_AHORA)[number];
export const esEstadoAhora = (v: unknown): v is EstadoAhora => esUno(ESTADOS_AHORA, v);

// `inicio_semana_futuro` (contrato v2.1): el inicio de semana quedó después de
// ahora; el servidor manda la fila como no configurada en vez de un 422.
export const MOTIVOS_NO_CONFIGURADO = ["sin_zona", "sin_inicio_semana", "inicio_semana_futuro"] as const;
export type MotivoNoConfigurado = (typeof MOTIVOS_NO_CONFIGURADO)[number];
export const esMotivoNoConfigurado = (v: unknown): v is MotivoNoConfigurado =>
  esUno(MOTIVOS_NO_CONFIGURADO, v);

export type UltimaActividadUsuario = {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly hora: string;
  readonly clienteNombre: string;
};

export type PagosPorForma = {
  readonly efectivo: Conteo;
  readonly transferencia: Conteo;
  readonly cheque: Conteo;
};

// Contrato v2.2 (D18): por_visitar + no_paga + pagados == cobertura.total;
// `sinNada` es el filtro de cobertura (total − con_algo), no una columna.
export type CoberturaPorColumna = {
  readonly porVisitar: number;
  readonly noPaga: number;
  readonly pagados: number;
  readonly sinNada: number;
};

export type Eje = { readonly desdeHora: number; readonly hastaHora: number };

export type UltimoMovimiento = {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly hora: string;
};

// Promedio por día de la semana en curso; null en periodo "hoy" y en semana
// vencida. `visitas` es decimal (2 cifras) y `pagosImporte` dinero en string.
export type PromedioDiario = {
  readonly dias: number;
  readonly minutosActivos: number;
  readonly pagosImporte: string;
  readonly visitas: number;
};

// Cobro de la semana del usuario. `falta` (esperado − cobrado) lo calcula el
// servidor (contrato v2): el escritorio nunca resta dinero (D10). `pct` es null
// cuando no hay esperado o el usuario no está configurado.
export type CobroSemana = {
  readonly cobrado: string;
  readonly esperado: string;
  readonly falta: string;
  readonly pct: string | null;
};

// UsuarioTablero: una fila del tablero = un usuario de Firestore (D1). Sin
// totales del equipo (D14). `cobertura`, `coberturaPorColumna` y `cobro` son
// siempre de la semana del usuario aunque el periodo sea "hoy" (contrato §2).
// Un usuario no configurado trae métricas en cero, `lineas = []` y puede traer
// `zonaId`, `zonaNombre`, `inicioSemana` y `cobro.pct` en null.
export type UsuarioTablero = {
  readonly uid: string;
  readonly nombre: string;
  readonly email: string;
  readonly zonaId: number | null;
  readonly zonaNombre: string | null;
  readonly configurado: boolean;
  readonly motivoNoConfigurado: MotivoNoConfigurado | null;
  readonly inicioSemana: string | null;
  readonly ventasUniverso: number;
  readonly estadoAhora: EstadoAhora;
  readonly estadoDesde: string | null;
  readonly ultima: UltimaActividadUsuario | null;
  readonly primeraActividad: string | null;
  readonly ultimaActividad: string | null;
  readonly minutosActivos: number;
  readonly pausas: ResumenPausas;
  readonly pagos: Conteo;
  readonly pagosPorForma: PagosPorForma;
  readonly condonaciones: Conteo;
  readonly noAplicados: Conteo;
  readonly visitas: number;
  readonly cobertura: { readonly conAlgo: number; readonly total: number };
  readonly semanaVencida: boolean;
  readonly ultimoMovimiento: UltimoMovimiento | null;
  readonly coberturaPorColumna: CoberturaPorColumna;
  readonly promedioDiario: PromedioDiario | null;
  readonly cobro: CobroSemana;
  readonly lineas: readonly LineaDelDia[];
};

export type Tablero = {
  readonly generadoAt: string;
  readonly hoy: string;
  readonly eje: Eje;
  readonly periodo: Periodo;
  readonly pausaMin: number;
  readonly usuarios: readonly UsuarioTablero[];
};

// FichaUsuario: GET /v2/desempeno/usuarios/{uid} (contrato v2.2 §8). Un solo
// usuario con su eje, el día de inicio de semana y los días navegables que
// calcula el servidor.
export type FichaUsuario = {
  readonly generadoAt: string;
  readonly hoy: string;
  readonly periodo: Periodo;
  readonly pausaMin: number;
  readonly eje: Eje;
  readonly usuario: UsuarioTablero;
  readonly inicioSemanaDia: string | null;
  readonly diasNavegables: readonly string[];
};
