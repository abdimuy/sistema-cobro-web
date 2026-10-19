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
  ColumnaFiltro,
  FichaUsuario,
  Tablero,
  UltimosMovimientos92Dias,
} from "../../domain/entities";

// Horario opcional de la consulta (D7): "HH:MM", ambos o ninguno.
export type Horario = { readonly desde: string; readonly hasta: string };

export type ConsultaJornada = {
  readonly pausaMin: number;
  readonly horario: Horario | null;
};

export type ConsultaTablero = ConsultaJornada & { readonly periodo: Periodo };

export type ConsultaCuentas = {
  readonly columna: ColumnaFiltro | null;
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
  // GET /v2/desempeno/usuarios/{uid} (contrato v2.2): un usuario con eje y días navegables.
  obtenerUsuario(uid: string, consulta: ConsultaTablero, signal?: AbortSignal): Promise<FichaUsuario>;
  // GET /v2/desempeno/ultimo-movimiento (contrato pulido 2 §3): UNA llamada con
  // 1 a 100 uids (LIMITE_UIDS_LOTE_MOVIMIENTO). Partir en trozos le toca al caso
  // de uso. `null` = sin movimiento en 92 días; uid ausente = no vino.
  obtenerUltimosMovimientos(uids: readonly string[], signal?: AbortSignal): Promise<UltimosMovimientos92Dias>;
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
