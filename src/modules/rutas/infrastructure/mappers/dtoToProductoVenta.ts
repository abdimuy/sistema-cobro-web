import type { ProductoVenta } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

// Raw shape of a single producto line from GET /clientes/{id}/ventas/{doctoPvId}.
// Only the fields we need are declared; extras are silently ignored.
type ProductoVentaRaw = Record<string, unknown>;

export function dtoToProductoVenta(dto: unknown): ProductoVenta {
  const raw = dto as ProductoVentaRaw;
  if (typeof raw.nombre !== "string" || raw.nombre.trim() === "") {
    throw new DomainError(
      "producto_invalido",
      "nombre del producto debe ser una cadena no vacía",
    );
  }

  if (typeof raw.unidades !== "string") {
    throw new DomainError(
      "producto_invalido",
      "unidades del producto debe ser una cadena decimal",
    );
  }

  if (typeof raw.precio_total_neto !== "string") {
    throw new DomainError(
      "producto_invalido",
      "precio_total_neto del producto debe ser una cadena decimal",
    );
  }

  return {
    nombre: raw.nombre,
    cantidad: raw.unidades,
    importe: raw.precio_total_neto,
  };
}
