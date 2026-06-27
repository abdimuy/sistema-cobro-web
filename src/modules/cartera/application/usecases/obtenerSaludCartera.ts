import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { SaludCartera } from "../../domain/entities";

export async function obtenerSaludCartera(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<SaludCartera> {
  return port.obtenerSalud(filters, signal);
}
