import type { IdentidadComando, SolicitudComandoArticulo, SolicitudComandoFolio, SolicitudAgregarArticulo, SolicitudAvanzarArticulo } from "../../domain/comandos";
import type { CatalogosGarantias } from "../../domain/catalogos";
import type { AxiosInstance } from "axios";
import type {
  GarantiasPort,
  PaginaSolicitada,
} from "../../application/ports/GarantiasPort";
import type {
  DetalleGarantia,
  FiltrosGarantias,
  PaginaGarantias,
} from "../../domain/garantia";

function segmento(id: string): string {
  return encodeURIComponent(id);
}

export class HttpGarantiasAdapter implements GarantiasPort {
  constructor(private readonly client: AxiosInstance) {}

  async agregarArticulo(
    garantiaId: string,
    solicitud: SolicitudAgregarArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { data } = await this.client.post(
      `/garantias/${segmento(garantiaId)}/articulos`,
      {
        ...solicitud,
        device_created_at: identidad.deviceCreatedAt,
      },
      {
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
        signal,
      },
    );
    return data;
  }

  async avanzarArticulo(
    garantiaId: string,
    articuloId: string,
    solicitud: SolicitudAvanzarArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { data } = await this.client.post(
      `/garantias/${segmento(garantiaId)}/articulos/${segmento(articuloId)}/avanzar`,
      {
        ...solicitud,
        device_created_at: identidad.deviceCreatedAt,
      },
      {
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
        signal,
      },
    );
    return data;
  }

  async obtenerCatalogos(signal?: AbortSignal): Promise<CatalogosGarantias> {
    const { data } = await this.client.get<CatalogosGarantias>(
      "/garantias/catalogos",
      { signal },
    );
    return data;
  }

  async ejecutarComandoArticulo(
    garantiaId: string,
    articuloId: string,
    comando: SolicitudComandoArticulo,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { tipo, ...datos } = comando;

    const ruta =
      `/garantias/${segmento(garantiaId)}` +
      `/articulos/${segmento(articuloId)}/${tipo}`;

    const { data } = await this.client.post<unknown>(
      ruta,
      {
        ...datos,
        device_created_at: identidad.deviceCreatedAt,
      },
      {
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
        signal,
      },
    );

    return data;
  }

  async entregarGarantia(
    garantiaId: string,
    firma: File,
    gpsLat: number,
    gpsLon: number,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const formulario = new FormData();
    formulario.append("device_created_at", identidad.deviceCreatedAt);
    formulario.append("gps_lat", String(gpsLat));
    formulario.append("gps_lon", String(gpsLon));
    formulario.append("firma", firma, firma.name);

    const { data } = await this.client.post<unknown>(
      `/garantias/${segmento(garantiaId)}/entregar`,
      formulario,
      {
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
        signal,
      },
    );

    return data;
  }

  async ejecutarComandoFolio(
    garantiaId: string,
    comando: SolicitudComandoFolio,
    identidad: IdentidadComando,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { tipo, ...datos } = comando;

    const ruta = `/garantias/${segmento(garantiaId)}/${tipo}`;

    const { data } = await this.client.post<unknown>(
      ruta,
      {
        ...datos,
        device_created_at: identidad.deviceCreatedAt,
      },
      {
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
        signal,
      },
    );

    return data;
  }

  async listar(
    filtros: FiltrosGarantias,
    pagina: PaginaSolicitada,
    signal?: AbortSignal,
  ): Promise<PaginaGarantias> {
    const { data } = await this.client.get<PaginaGarantias>(
      "/garantias",
      {
        params: {
          ...filtros,
          limit: pagina.limit,
          ...(pagina.cursor ? { cursor: pagina.cursor } : {}),
        },
        signal,
      },
    );

    return data;
  }

  async obtener(
    id: string,
    signal?: AbortSignal,
  ): Promise<DetalleGarantia> {
    const { data } = await this.client.get<DetalleGarantia>(
      `/garantias/${segmento(id)}`,
      { signal },
    );

    return data;
  }

  async descargarImagen(
    garantiaId: string,
    eventoId: string,
    imagenId: string,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const ruta =
      `/garantias/${segmento(garantiaId)}` +
      `/eventos/${segmento(eventoId)}` +
      `/imagenes/${segmento(imagenId)}`;

    const { data } = await this.client.get<Blob>(ruta, {
      responseType: "blob",
      signal,
    });

    return data;
  }
}
