import type {
  Agenda,
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
  EstadoTarea,
  NuevaTarea,
  Tablero,
  Tarea,
  TareaConEstado,
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
  // GET /v2/visitas/agenda?zona_id=&hoy= (visitas P2, spec §5.5): compromiso
  // vigente por venta de la zona con el estado que deriva el servidor. `hoy`
  // null = el día de hoy del servidor (America/Mexico_City).
  obtenerAgenda(zonaId: number, hoy: string | null, signal?: AbortSignal): Promise<Agenda>;
  // Tareas de visita (visitas P3, spec §6.2). POST /v2/visitas/tareas: el
  // mismo id con el mismo contenido responde igual (idempotente).
  asignarTarea(cuerpo: NuevaTarea): Promise<Tarea>;
  // POST /v2/visitas/tareas/{id}/cancelar: repetida responde igual.
  cancelarTarea(id: string): Promise<Tarea>;
  // GET /v2/visitas/tareas?zona_id=&estado=&desde=: con el estado derivado.
  listarTareas(
    zonaId: number,
    estado: EstadoTarea | null,
    desde: string | null,
    signal?: AbortSignal,
  ): Promise<TareaConEstado[]>;
  listarImagenes(ref: RefImagenes, signal?: AbortSignal): Promise<ImagenAdjunta[]>;
  descargarImagen(
    ref: RefImagenes,
    imagenId: string,
    signal?: AbortSignal,
  ): Promise<Blob>;
}
