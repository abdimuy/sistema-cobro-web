import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { AgingBucket } from "../../domain/entities";

export async function obtenerAging(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<AgingBucket[]> {
  return port.obtenerAging(filters, signal);
}
