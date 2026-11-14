import type { IdentidadComando, SolicitudComandoArticulo, SolicitudComandoFolio, SolicitudAgregarArticulo, SolicitudAvanzarArticulo } from "../../domain/comandos";
import type { CatalogosGarantias } from "../../domain/catalogos";
import type {
  DetalleGarantia,
  FiltrosGarantias,
  PaginaGarantias,
} from "../../domain/garantia";

export interface PaginaSolicitada {
  readonly cursor?: string;
  readonly limit: number;
}

export interface GarantiasPort {
  agregarArticulo(
    garantiaId: string,
    solicitud: SolicitudAgregarArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown>;

  avanzarArticulo(
    garantiaId: string,
    articuloId: string,
    solicitud: SolicitudAvanzarArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown>;

  entregarGarantia(
    garantiaId: string,
    firma: File,
    gpsLat: number,
    gpsLon: number,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown>;


  ejecutarComandoFolio(
    garantiaId: string,
    comando: SolicitudComandoFolio,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown>;

  ejecutarComandoArticulo(
    garantiaId: string,
    articuloId: string,
    comando: SolicitudComandoArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown>;

  obtenerCatalogos(signal?: AbortSignal): Promise<CatalogosGarantias>;

  listar(
    filtros: FiltrosGarantias,
    pagina: PaginaSolicitada,
    signal?: AbortSignal,
  ): Promise<PaginaGarantias>;

  obtener(
    id: string,
    signal?: AbortSignal,
  ): Promise<DetalleGarantia>;

  descargarImagen(
    garantiaId: string,
    eventoId: string,
    imagenId: string,
    signal?: AbortSignal,
  ): Promise<Blob>;
}
