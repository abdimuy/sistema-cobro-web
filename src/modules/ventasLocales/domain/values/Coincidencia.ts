export type OrigenVenta = "app" | "archivo";
export type FiltroOrigen = "todas" | OrigenVenta;

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
