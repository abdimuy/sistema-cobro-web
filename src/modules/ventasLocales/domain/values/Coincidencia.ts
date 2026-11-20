export type OrigenVenta = "app" | "archivo";
export type FiltroOrigen = "todas" | OrigenVenta;

/** Ventas Locales abre en las ventas de la app (decisión del dueño, 2026-11-20). */
export const FILTRO_ORIGEN_INICIAL: FiltroOrigen = "app";

export type CampoCoincidencia = "cliente" | "telefono" | "folio" | "direccion" | "articulos";

export interface Segmento {
  texto: string;
  coincide: boolean;
}

export interface Coincidencia {
  campo: CampoCoincidencia;
  segmentos: Segmento[];
  aproximada: boolean;
  recortado: boolean;
}

export interface ConteoOrigen {
  app: number | null;
  archivo: number | null;
}
