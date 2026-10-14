import type { Actividad, FormaCobro, TipoActividad } from "./Actividad";

export const ORDENES_ACTIVIDAD = [
  "hora",
  "cliente",
  "monto",
  "tipo",
  "registrado_por",
] as const;
export type OrdenActividad = (typeof ORDENES_ACTIVIDAD)[number];
export type Direccion = "asc" | "desc";

// Valor de `registrado_por` que pide lo capturado directo en Microsip.
export const REGISTRADO_POR_OFICINA = "oficina";

export const LIMITE_PAGINA_ACTIVIDAD = 100;

// FiltrosActividad: espejo de los parámetros de GET .../actividad (contrato §4).
// `desde`/`hasta` son instantes RFC3339 (los arma la UI con tiempoDeNegocio).
// `formasCobro` lleva los códigos del contrato (no ids) y `tiposVisita` los
// literales exactos que entrega GET /v2/desempeno/catalogos.
export type FiltrosActividad = {
  readonly desde: string | null;
  readonly hasta: string | null;
  readonly tipos: readonly TipoActividad[];
  readonly formasCobro: readonly FormaCobro[];
  readonly tiposVisita: readonly string[];
  readonly registradoPor: readonly string[];
  readonly montoMin: string | null;
  readonly montoMax: string | null;
  readonly conFotos: boolean | null;
  readonly conGps: boolean | null;
  readonly q: string;
  readonly orden: OrdenActividad;
  readonly dir: Direccion;
};

export const FILTROS_ACTIVIDAD_INICIALES: FiltrosActividad = {
  desde: null,
  hasta: null,
  tipos: [],
  formasCobro: [],
  tiposVisita: [],
  registradoPor: [],
  montoMin: null,
  montoMax: null,
  conFotos: null,
  conGps: null,
  q: "",
  orden: "hora",
  dir: "desc",
};

// TotalesActividad: `importe` es solo dinero (formas 157/158/52569, no
// rechazados); las condonaciones NO suman ahí (contrato v2 §4).
export type TotalesActividad = {
  readonly n: number;
  readonly importe: string;
  readonly porTipo: {
    readonly pago: number;
    readonly visita: number;
    readonly condonacion: number;
  };
};

export type PaginaActividad = {
  readonly items: readonly Actividad[];
  readonly siguienteCursor: string | null;
  readonly totales: TotalesActividad;
};
