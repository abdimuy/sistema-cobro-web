import { esUno } from "../values/esUno";

export const TIPOS_SENAL = [
  "pausa_larga",
  "inicio_tarde",
  "fin_temprano",
  "mismo_punto",
  "captura_tardia",
  "sin_gps",
] as const;
export type TipoSenal = (typeof TIPOS_SENAL)[number];
export const esTipoSenal = (v: unknown): v is TipoSenal => esUno(TIPOS_SENAL, v);

// Senal: algo "para revisar". `detalle` y `regla` vienen en español del servidor.
export type Senal = {
  readonly tipo: TipoSenal;
  readonly actividadIds: readonly string[];
  readonly desde: string | null;
  readonly hasta: string | null;
  readonly detalle: string;
  readonly regla: string;
};
