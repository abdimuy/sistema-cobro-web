import type { AxiosInstance } from "axios";
import type { WinbackAttribution } from "../../domain/entities/WinbackAttribution";
import type { RefreshResult } from "../../domain/entities/RefreshResult";
import type { WinbackAnalyticsPort } from "../../application/ports/WinbackAnalyticsPort";
import type {
  ListarWinbackInput,
  ListarWinbackOutput,
  AttributionInput,
  RefrescarInput,
} from "../../application/dto";

import { dtoToWinbackItem } from "../mappers/dtoToWinbackItem";
import { dtoToAttribution } from "../mappers/dtoToAttribution";
import { apperrorToDomainError } from "../mappers/errorMapper";
import type {
  WinbackListResponseDTO,
  AttributionDTO,
  RefreshResponseDTO,
} from "./dtos";

const WINBACK_BASE = "/analytics/winback";

// HttpWinbackAdapter is the production implementation of WinbackAnalyticsPort.
// It talks to /v2/analytics/winback via the provided axios client (which
// injects the Firebase Bearer token). All errors are funneled through
// apperrorToDomainError so callers only see DomainError instances.
export class HttpWinbackAdapter implements WinbackAnalyticsPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarItems(
    input: ListarWinbackInput,
    signal?: AbortSignal,
  ): Promise<ListarWinbackOutput> {
    try {
      const params: Record<string, string | number | boolean> = {};
      if (input.segmento !== undefined) params.segmento = input.segmento;
      if (input.zona !== undefined) params.zona = input.zona;
      if (input.limit !== undefined) params.limit = input.limit;
      if (input.incluirControl !== undefined)
        params.incluir_control = input.incluirControl;
      if (input.incluirActivos !== undefined)
        params.incluir_activos = input.incluirActivos;

      const { data } = await this.client.get<WinbackListResponseDTO>(
        WINBACK_BASE,
        { params, signal },
      );

      return {
        items: data.items.map(dtoToWinbackItem),
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerAttribution(
    input: AttributionInput,
    signal?: AbortSignal,
  ): Promise<WinbackAttribution> {
    try {
      const params: Record<string, string> = {};
      if (input.zona !== undefined) params.zona = input.zona;

      const { data } = await this.client.get<AttributionDTO>(
        `${WINBACK_BASE}/attribution`,
        { params, signal },
      );

      return dtoToAttribution(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async refrescar(input: RefrescarInput): Promise<RefreshResult> {
    try {
      const { data } = await this.client.post<RefreshResponseDTO>(
        `${WINBACK_BASE}/refresh`,
        { full: input.full },
      );

      return {
        estado: data.estado,
        mensaje: data.mensaje,
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
