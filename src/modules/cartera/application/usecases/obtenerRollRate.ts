import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { RollRate } from "../../domain/entities";

export async function obtenerRollRate(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<RollRate> {
  return port.obtenerRollRate(filters, signal);
}
