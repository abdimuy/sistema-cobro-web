import type { AxiosInstance } from "axios";
import type { DesgloseCobranza, RutasPort } from "../../application/ports/RutasPort";
import type { ProductoVenta, ReporteUsuario, Ruta } from "../../domain/entities";
import type {
  DesgloseCobranzaDTO,
  ReporteUsuariosListResponseDTO,
  RutasListResponseDTO,
} from "./dtos";
import { dtoToRuta } from "../mappers/dtoToRuta";
import { dtoToReporteUsuario } from "../mappers/dtoToReporteUsuario";
import { dtoToVentaCobranza } from "../mappers/dtoToVentaCobranza";
import { dtoToProductoVenta } from "../mappers/dtoToProductoVenta";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpRutasAdapter is the production implementation of RutasPort.
// It talks to /v2/rutas via the provided axios client (which injects
// the Firebase Bearer token). All errors are funneled through
// apperrorToDomainError so callers only see DomainError instances.
export class HttpRutasAdapter implements RutasPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarRutas(signal?: AbortSignal): Promise<Ruta[]> {
    try {
      const { data } = await this.client.get<RutasListResponseDTO>("/rutas", {
        signal,
      });
      return data.items.map(dtoToRuta);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarReporteUsuarios(
    signal?: AbortSignal,
  ): Promise<ReporteUsuario[]> {
    try {
      const { data } =
        await this.client.get<ReporteUsuariosListResponseDTO>(
          "/rutas/reporte-usuarios",
          { signal },
        );
      return data.items.map(dtoToReporteUsuario);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza> {
    try {
      const { data } = await this.client.get<DesgloseCobranzaDTO>(
        `/rutas/${zonaId}/cobranza`,
        { signal },
      );
      return this.mapDesglose(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async desgloseCobranzaPorUsuario(
    uid: string,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza> {
    try {
      const { data } = await this.client.get<DesgloseCobranzaDTO>(
        `/rutas/usuarios/${encodeURIComponent(uid)}/cobranza`,
        { signal },
      );
      return this.mapDesglose(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  private mapDesglose(data: DesgloseCobranzaDTO): DesgloseCobranza {
    return {
      fechaInicioSemana: data.fecha_inicio_semana,
      ventas: data.items.map(dtoToVentaCobranza),
      resumen: {
        numerador: data.resumen.numerador,
        denominador: data.resumen.denominador,
        pctPonderado: data.resumen.pct_ponderado,
      },
    };
  }

  async obtenerProductos(
    clienteId: number,
    doctoPvId: number,
    signal?: AbortSignal,
  ): Promise<ProductoVenta[]> {
    try {
      const { data } = await this.client.get<{ productos: unknown[] }>(
        `/clientes/${clienteId}/ventas/${doctoPvId}`,
        { signal },
      );
      const productos: unknown[] = data.productos ?? [];
      return productos.map(dtoToProductoVenta);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
