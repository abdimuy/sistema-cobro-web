import type {
  Catalogos,
  CuentasSemana,
  FiltrosActividad,
  ImagenAdjunta,
  Jornada,
  PaginaActividad,
  RefImagenes,
  Tablero,
} from "../../domain/entities";
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
