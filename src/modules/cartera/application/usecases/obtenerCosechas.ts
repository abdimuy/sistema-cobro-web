import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { Cosecha } from "../../domain/entities";

export async function obtenerCosechas(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<Cosecha[]> {
  return port.obtenerCosechas(filters, signal);
}
