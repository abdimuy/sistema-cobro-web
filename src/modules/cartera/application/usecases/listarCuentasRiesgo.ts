import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type { CuentaRiesgo } from "../../domain/entities";

export async function listarCuentasRiesgo(
  port: CarteraPort,
  filters: CarteraFilters,
  signal?: AbortSignal,
): Promise<CuentaRiesgo[]> {
  return port.obtenerCuentasRiesgo(filters, signal);
}
