import type { AxiosInstance } from "axios";
import type { RutasPort } from "../../application/ports/RutasPort";
import type { Ruta, VentaCobranza } from "../../domain/entities";
import type { DesgloseCobranzaDTO, RutasListResponseDTO } from "./dtos";
import { dtoToRuta } from "../mappers/dtoToRuta";
import { dtoToVentaCobranza } from "../mappers/dtoToVentaCobranza";
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

  async desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<{ fechaInicioSemana: string | null; ventas: VentaCobranza[] }> {
    try {
      const { data } = await this.client.get<DesgloseCobranzaDTO>(
        `/rutas/${zonaId}/cobranza`,
        { signal },
      );
      return {
        fechaInicioSemana: data.fecha_inicio_semana,
        ventas: data.items.map(dtoToVentaCobranza),
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
