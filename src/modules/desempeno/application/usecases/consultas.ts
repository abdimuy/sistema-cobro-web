import type {
  Agenda,
  Catalogos,
  CuentasSemana,
  FichaUsuario,
  FiltrosActividad,
  ImagenAdjunta,
  Jornada,
  PaginaActividad,
  RefImagenes,
  Tablero,
  UltimoMovimiento,
} from "../../domain/entities";
import { LIMITE_UIDS_LOTE_MOVIMIENTO } from "../../domain/entities";
import type {
  ConsultaCuentas,
  ConsultaJornada,
  ConsultaTablero,
  DesempenoPort,
  PaginaSolicitada,
} from "../ports/DesempenoPort";

// Casos de uso de solo lectura. Son pass-through a propósito (README de
// ventasLocales): la indirección deja meter telemetría o caché sin que la
// presentación toque infraestructura. Ninguno calcula nada (D10).

export function obtenerTablero(
  port: DesempenoPort,
  consulta: ConsultaTablero,
  signal?: AbortSignal,
): Promise<Tablero> {
  return port.obtenerTablero(consulta, signal);
}

export function obtenerUsuario(
  port: DesempenoPort,
  uid: string,
  consulta: ConsultaTablero,
  signal?: AbortSignal,
): Promise<FichaUsuario> {
  return port.obtenerUsuario(uid, consulta, signal);
}

// Contrato pulido 2 §3–§4: el lote acepta de 1 a 100 uids. Se quitan los
// repetidos, se parte en trozos de LIMITE_UIDS_LOTE_MOVIMIENTO (una llamada por
// trozo) y se unen. Si un trozo falla, falla todo: nunca se pinta una mezcla
// de fechas y "—" que parezca completa. Sin uids no se llama.
export async function obtenerUltimosMovimientos92Dias(
  port: DesempenoPort,
  uids: readonly string[],
  signal?: AbortSignal,
): Promise<ReadonlyMap<string, UltimoMovimiento | null>> {
  const unicos = [...new Set(uids)];
  const trozos: string[][] = [];
  for (let i = 0; i < unicos.length; i += LIMITE_UIDS_LOTE_MOVIMIENTO) {
    trozos.push(unicos.slice(i, i + LIMITE_UIDS_LOTE_MOVIMIENTO));
  }
  const respuestas = await Promise.all(trozos.map((t) => port.obtenerUltimosMovimientos(t, signal)));
  const porUid = new Map<string, UltimoMovimiento | null>();
  for (const r of respuestas) for (const [uid, m] of r.porUid) porUid.set(uid, m);
  return porUid;
}

export function obtenerJornada(
  port: DesempenoPort,
  uid: string,
  fecha: string,
  consulta: ConsultaJornada,
  signal?: AbortSignal,
): Promise<Jornada> {
  return port.obtenerJornada(uid, fecha, consulta, signal);
}

export function listarActividad(
  port: DesempenoPort,
  uid: string,
  filtros: FiltrosActividad,
  pagina: PaginaSolicitada,
  signal?: AbortSignal,
): Promise<PaginaActividad> {
  return port.listarActividad(uid, filtros, pagina, signal);
}

export function obtenerCuentas(
  port: DesempenoPort,
  uid: string,
  consulta: ConsultaCuentas,
  signal?: AbortSignal,
): Promise<CuentasSemana> {
  return port.obtenerCuentas(uid, consulta, signal);
}

export function obtenerCatalogos(
  port: DesempenoPort,
  signal?: AbortSignal,
): Promise<Catalogos> {
  return port.obtenerCatalogos(signal);
}

export function listarImagenes(
  port: DesempenoPort,
  ref: RefImagenes,
  signal?: AbortSignal,
): Promise<ImagenAdjunta[]> {
  return port.listarImagenes(ref, signal);
}

export function descargarImagen(
  port: DesempenoPort,
  ref: RefImagenes,
  imagenId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return port.descargarImagen(ref, imagenId, signal);
}

// Agenda de compromisos de la zona (visitas P2, spec §5.5). Pass-through: el
// estado de cada compromiso lo deriva el servidor.
export function obtenerAgenda(
  port: DesempenoPort,
  zonaId: number,
  hoy: string | null,
  signal?: AbortSignal,
): Promise<Agenda> {
  return port.obtenerAgenda(zonaId, hoy, signal);
}
