import type {
  Catalogos,
  CuentasSemana,
  Direccion,
  FiltrosActividad,
  ImagenAdjunta,
  Jornada,
  OrdenCuentas,
  PaginaActividad,
  Periodo,
  RefImagenes,
  SegmentoFiltro,
  Tablero,
} from "../../domain/entities";

// Horario opcional de la consulta (D7): "HH:MM", ambos o ninguno.
export type Horario = { readonly desde: string; readonly hasta: string };

export type ConsultaJornada = {
  readonly pausaMin: number;
  readonly horario: Horario | null;
};

export type ConsultaTablero = ConsultaJornada & { readonly periodo: Periodo };

export type ConsultaCuentas = {
  readonly segmento: SegmentoFiltro | null;
  readonly q: string;
  readonly orden: OrdenCuentas;
  readonly dir: Direccion;
};

export type PaginaSolicitada = {
  readonly cursor: string | null;
  readonly limit: number;
};

// DesempenoPort: un método por endpoint de los contratos. El adapter HTTP lo
// cumple en producción; FakeDesempenoPort en pruebas y mientras no hay API.
export interface DesempenoPort {
  obtenerTablero(consulta: ConsultaTablero, signal?: AbortSignal): Promise<Tablero>;
  obtenerJornada(
    uid: string,
    fecha: string,
    consulta: ConsultaJornada,
    signal?: AbortSignal,
  ): Promise<Jornada>;
  listarActividad(
    uid: string,
    filtros: FiltrosActividad,
    pagina: PaginaSolicitada,
    signal?: AbortSignal,
  ): Promise<PaginaActividad>;
  obtenerCuentas(
    uid: string,
    consulta: ConsultaCuentas,
    signal?: AbortSignal,
  ): Promise<CuentasSemana>;
  // GET /v2/desempeno/catalogos (contrato v2 §4b): formas de cobro y tipos de
  // visita para armar los filtros de Actividad.
  obtenerCatalogos(signal?: AbortSignal): Promise<Catalogos>;
  listarImagenes(ref: RefImagenes, signal?: AbortSignal): Promise<ImagenAdjunta[]>;
  descargarImagen(
    ref: RefImagenes,
    imagenId: string,
    signal?: AbortSignal,
  ): Promise<Blob>;
}
