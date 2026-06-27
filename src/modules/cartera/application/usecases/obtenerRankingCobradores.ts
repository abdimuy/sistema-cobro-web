import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { CobradorPerformance } from "../../domain/entities";

export async function obtenerRankingCobradores(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<CobradorPerformance[]> {
  return port.obtenerCobradores(filters, signal);
}
