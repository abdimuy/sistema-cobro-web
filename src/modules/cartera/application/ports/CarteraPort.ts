import type { CarteraFilters } from "../dto/CarteraFilters";
import type {
  SaludCartera,
  AgingBucket,
  Cosecha,
  CobradorPerformance,
  CuentaRiesgo,
  RollRate,
} from "../../domain/entities";

export interface CarteraPort {
  obtenerSalud(filters: CarteraFilters, signal?: AbortSignal): Promise<SaludCartera>;
  obtenerAging(filters: CarteraFilters, signal?: AbortSignal): Promise<AgingBucket[]>;
  obtenerCosechas(filters: CarteraFilters, signal?: AbortSignal): Promise<Cosecha[]>;
  obtenerCobradores(filters: CarteraFilters, signal?: AbortSignal): Promise<CobradorPerformance[]>;
  obtenerCuentasRiesgo(filters: CarteraFilters, signal?: AbortSignal): Promise<CuentaRiesgo[]>;
  obtenerRollRate(filters: CarteraFilters, signal?: AbortSignal): Promise<RollRate>;
}
