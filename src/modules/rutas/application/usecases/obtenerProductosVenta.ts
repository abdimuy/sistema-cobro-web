import type { RutasPort } from "../ports/RutasPort";
import type { ProductoVenta } from "../../domain/entities";

export async function obtenerProductosVenta(
  port: RutasPort,
  clienteId: number,
  doctoPvId: number,
  signal?: AbortSignal,
): Promise<ProductoVenta[]> {
  return port.obtenerProductos(clienteId, doctoPvId, signal);
}
