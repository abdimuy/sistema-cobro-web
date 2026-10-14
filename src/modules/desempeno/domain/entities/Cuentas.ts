import type { EstadoCuenta, Segmento, Trato } from "../values/estadoCuenta";
import type { Direccion } from "./ActividadZona";
import type { TipoActividad } from "./Actividad";

export type UltimaActividadCuenta = {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly hora: string;
};

// Cuenta: una venta del universo de la semana del usuario (contrato §5).
export type Cuenta = {
  readonly ventaId: number;
  readonly doctoPvId: number | null;
  readonly folio: string | null;
  readonly clienteId: number;
  readonly clienteNombre: string;
  readonly producto: string | null;
  readonly estado: EstadoCuenta;
  readonly trato: Trato;
  readonly etiqueta: string;
  readonly detalle: string;
  readonly segmento: Segmento | null;
  readonly conAlgo: boolean;
  readonly determinadoPor: string | null;
  readonly ultimaActividad: UltimaActividadCuenta | null;
  readonly saldo: string;
  readonly parcialidad: string;
  readonly abonoSemana: string;
  readonly numAtrasos: number;
  readonly nueva: boolean;
};

export type ConteosCuentas = {
  readonly sinVisitar: number;
  readonly volver: number;
  readonly despues: number;
  readonly pagados: number;
  readonly sinNada: number;
  readonly total: number;
};

export type CuentasSemana = {
  readonly inicioSemana: string;
  readonly conteos: ConteosCuentas;
  readonly cuentas: readonly Cuenta[];
};

export type SegmentoFiltro = Segmento | "sin_nada";

export const ORDENES_CUENTAS = ["cliente", "saldo", "atrasos", "ultima_actividad"] as const;
export type OrdenCuentas = (typeof ORDENES_CUENTAS)[number];

export type { Direccion };
