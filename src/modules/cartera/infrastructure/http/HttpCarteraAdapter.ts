import type { AxiosInstance } from "axios";
import type { CarteraPort } from "../../application/ports/CarteraPort";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import type { SaludCartera } from "../../domain/entities/SaludCartera";
import type { AgingBucket } from "../../domain/entities/AgingBucket";
import type { Cosecha } from "../../domain/entities/Cosecha";
import type { CobradorPerformance } from "../../domain/entities/CobradorPerformance";
import type { CuentaRiesgo } from "../../domain/entities/CuentaRiesgo";
import type { RollRate } from "../../domain/entities/RollRate";
import type {
  SaludCarteraDTO,
  AgingResponseDTO,
  CosechasResponseDTO,
  CobradoresResponseDTO,
  CuentasRiesgoResponseDTO,
  RollRateDTO,
} from "./dtos";
import { dtoToSaludCartera } from "../mappers/dtoToSaludCartera";
import { dtoToAgingBucket } from "../mappers/dtoToAgingBucket";
import { dtoToCosecha } from "../mappers/dtoToCosecha";
import { dtoToCobradorPerformance } from "../mappers/dtoToCobradorPerformance";
import { dtoToCuentaRiesgo } from "../mappers/dtoToCuentaRiesgo";
import { dtoToRollRate } from "../mappers/dtoToRollRate";
import { apperrorToDomainError } from "../mappers/errorMapper";

const CARTERA_BASE = "/analytics/cartera";

// HttpCarteraAdapter is the production implementation of CarteraPort.
// All errors are funneled through apperrorToDomainError so callers only see DomainError.
export class HttpCarteraAdapter implements CarteraPort {
  constructor(private readonly client: AxiosInstance) {}

  async obtenerSalud(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<SaludCartera> {
    try {
      const params = buildParams(filters);
      const { data } = await this.client.get<SaludCarteraDTO>(
        `${CARTERA_BASE}/salud`,
        { params, signal },
      );
      return dtoToSaludCartera(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerAging(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<AgingBucket[]> {
    try {
      const params = buildParams(filters);
      const { data } = await this.client.get<AgingResponseDTO>(
        `${CARTERA_BASE}/aging`,
        { params, signal },
      );
      return data.items.map(dtoToAgingBucket);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerCosechas(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<Cosecha[]> {
    try {
      const params = buildParams(filters);
      const { data } = await this.client.get<CosechasResponseDTO>(
        `${CARTERA_BASE}/cosechas`,
        { params, signal },
      );
      return data.items.map(dtoToCosecha);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerCobradores(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<CobradorPerformance[]> {
    try {
      const params = buildParams(filters);
      const { data } = await this.client.get<CobradoresResponseDTO>(
        `${CARTERA_BASE}/cobradores`,
        { params, signal },
      );
      return data.items.map(dtoToCobradorPerformance);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerCuentasRiesgo(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<CuentaRiesgo[]> {
    try {
      // Backend ignores zona/cobrador for this endpoint — client-side filter only.
      // Only send periodo if provided.
      const params: Record<string, string> = {};
      if (filters.periodo !== undefined) params.periodo = filters.periodo;
      const { data } = await this.client.get<CuentasRiesgoResponseDTO>(
        `${CARTERA_BASE}/cuentas-riesgo`,
        { params, signal },
      );
      return data.items.map(dtoToCuentaRiesgo);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerRollRate(
    filters: CarteraFilters,
    signal?: AbortSignal,
  ): Promise<RollRate> {
    try {
      const params = buildParams(filters);
      const { data } = await this.client.get<RollRateDTO>(
        `${CARTERA_BASE}/roll-rate`,
        { params, signal },
      );
      return dtoToRollRate(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}

function buildParams(filters: CarteraFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.zona !== undefined) params.zona = filters.zona;
  if (filters.cobrador !== undefined) params.cobrador = filters.cobrador;
  if (filters.periodo !== undefined) params.periodo = filters.periodo;
  return params;
}
