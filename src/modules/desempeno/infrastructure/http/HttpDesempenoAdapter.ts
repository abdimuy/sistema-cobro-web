import type { AxiosInstance } from "axios";
import type {
  ConsultaCuentas,
  ConsultaJornada,
  ConsultaTablero,
  DesempenoPort,
  PaginaSolicitada,
} from "../../application/ports/DesempenoPort";
import type {
  Catalogos,
  CuentasSemana,
  FichaUsuario,
  FiltrosActividad,
  ImagenAdjunta,
  Jornada,
  PaginaActividad,
  RefImagenes,
  Tablero,
  UltimosMovimientos92Dias,
} from "../../domain/entities";
import type {
  CatalogosDTO,
  CuentasDTO,
  FichaUsuarioDTO,
  ImagenDTO,
  JornadaDTO,
  PaginaActividadDTO,
  TableroDTO,
  UltimosMovimientosDTO,
} from "./dtos";
import { paramsDeActividad, paramsDeCuentas, paramsDeJornada, paramsDeUltimosMovimientos, type Params } from "./params";
import {
  dtoToCatalogos,
  dtoToCuentas,
  dtoToFichaUsuario,
  dtoToImagen,
  dtoToJornada,
  dtoToPaginaActividad,
  dtoToTablero,
  dtoToUltimosMovimientos,
} from "../mappers/dtoADominio";
import { apperrorToDomainError, normalizarErrorBlob } from "../mappers/errorMapper";

const USUARIOS = "/desempeno/usuarios";
const CATALOGOS = "/desempeno/catalogos";
// Ruta estática fuera de /usuarios/{uid} (contrato pulido 2 §3).
const ULTIMO_MOVIMIENTO = "/desempeno/ultimo-movimiento";
const SERIALIZAR = { indexes: null } as const;

function rutaUsuario(uid: string, recurso: string): string {
  return `${USUARIOS}/${encodeURIComponent(uid)}/${recurso}`;
}

function rutaImagenes(ref: RefImagenes): string {
  return ref.tipo === "pago"
    ? `/cobranza/pagos/${encodeURIComponent(ref.pagoRecibidoId)}/imagenes`
    : `/visitas/${encodeURIComponent(ref.visitaId)}/imagenes`;
}

// HttpDesempenoAdapter: implementación de producción de DesempenoPort contra
// /v2/desempeno/* y las fotos de cobranza/visitas (contrato v2). Todo error
// sale como DomainError con el código del contrato.
export class HttpDesempenoAdapter implements DesempenoPort {
  constructor(private readonly client: AxiosInstance) {}

  async obtenerTablero(c: ConsultaTablero, signal?: AbortSignal): Promise<Tablero> {
    try {
      const { data } = await this.client.get<TableroDTO>(USUARIOS, {
        params: { periodo: c.periodo, ...paramsDeJornada(c) },
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToTablero(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerUsuario(uid: string, c: ConsultaTablero, signal?: AbortSignal): Promise<FichaUsuario> {
    try {
      const { data } = await this.client.get<FichaUsuarioDTO>(`${USUARIOS}/${encodeURIComponent(uid)}`, {
        params: { periodo: c.periodo, ...paramsDeJornada(c) },
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToFichaUsuario(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerUltimosMovimientos(uids: readonly string[], signal?: AbortSignal): Promise<UltimosMovimientos92Dias> {
    try {
      const { data } = await this.client.get<UltimosMovimientosDTO>(ULTIMO_MOVIMIENTO, {
        params: paramsDeUltimosMovimientos(uids),
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToUltimosMovimientos(data, uids);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerJornada(uid: string, fecha: string, c: ConsultaJornada, signal?: AbortSignal): Promise<Jornada> {
    try {
      const { data } = await this.client.get<JornadaDTO>(rutaUsuario(uid, "jornada"), {
        params: { fecha, ...paramsDeJornada(c) },
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToJornada(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarActividad(
    uid: string,
    filtros: FiltrosActividad,
    pagina: PaginaSolicitada,
    signal?: AbortSignal,
  ): Promise<PaginaActividad> {
    try {
      const params: Params = { ...paramsDeActividad(filtros), limit: pagina.limit };
      if (pagina.cursor) params.cursor = pagina.cursor;
      const { data } = await this.client.get<PaginaActividadDTO>(rutaUsuario(uid, "actividad"), {
        params,
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToPaginaActividad(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerCuentas(uid: string, c: ConsultaCuentas, signal?: AbortSignal): Promise<CuentasSemana> {
    try {
      const { data } = await this.client.get<CuentasDTO>(rutaUsuario(uid, "cuentas"), {
        params: paramsDeCuentas(c),
        paramsSerializer: SERIALIZAR,
        signal,
      });
      return dtoToCuentas(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerCatalogos(signal?: AbortSignal): Promise<Catalogos> {
    try {
      const { data } = await this.client.get<CatalogosDTO>(CATALOGOS, { signal });
      return dtoToCatalogos(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarImagenes(ref: RefImagenes, signal?: AbortSignal): Promise<ImagenAdjunta[]> {
    try {
      const { data } = await this.client.get<ImagenDTO[]>(rutaImagenes(ref), { signal });
      return data.map(dtoToImagen);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async descargarImagen(ref: RefImagenes, imagenId: string, signal?: AbortSignal): Promise<Blob> {
    try {
      const { data } = await this.client.get<Blob>(`${rutaImagenes(ref)}/${encodeURIComponent(imagenId)}`, {
        responseType: "blob",
        signal,
      });
      return data;
    } catch (e) {
      throw apperrorToDomainError(await normalizarErrorBlob(e));
    }
  }
}
