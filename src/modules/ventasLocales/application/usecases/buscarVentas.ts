import type { VentasListPort } from "../ports/VentasListPort";
import type { BuscarVentasInput } from "../dto/BuscarVentasInput";
import type { BuscarVentasOutput } from "../dto/BuscarVentasOutput";
import { DomainError } from "../../domain/errors";

// MAX_LIMIT mirrors the backend clamp. Asking for more is a UI bug; we
// refuse to round-trip it.
const MAX_LIMIT = 500;

// ALLOWED_SORT_BY mirrors the backend sort_by enum for GET /v2/ventas.
// ciudad/tipoVenta (legacy UI sort keys) have no backend equivalent and must
// never reach here — the presentation layer drops them before calling
// buscarVentas.
const ALLOWED_SORT_BY = ["fecha_venta", "precio_total", "nombre_cliente"] as const;

export async function buscarVentas(
  port: VentasListPort,
  input: BuscarVentasInput,
  signal?: AbortSignal,
): Promise<BuscarVentasOutput> {
  if (input.limit !== undefined) {
    if (!Number.isInteger(input.limit) || input.limit <= 0) {
      throw new DomainError(
        "limit_invalido",
        "limit debe ser un entero positivo",
      );
    }
    if (input.limit > MAX_LIMIT) {
      throw new DomainError(
        "limit_excedido",
        `limit no puede exceder ${MAX_LIMIT}`,
      );
    }
  }
  if (input.sortBy !== undefined) {
    if (!ALLOWED_SORT_BY.includes(input.sortBy as (typeof ALLOWED_SORT_BY)[number])) {
      throw new DomainError(
        "sort_by_invalido",
        "sortBy no es una columna ordenable válida",
      );
    }
  }
  if (input.sortOrder !== undefined) {
    if (input.sortOrder !== "asc" && input.sortOrder !== "desc") {
      throw new DomainError(
        "sort_order_invalido",
        "sortOrder debe ser asc o desc",
      );
    }
  }
  return port.buscarVentas(input, signal);
}
