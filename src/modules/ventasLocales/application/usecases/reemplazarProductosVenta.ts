import type { VentaEditPort, ProductosInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function reemplazarProductosVenta(
  deps: { port: VentaEditPort },
  input: ProductosInput,
): Promise<Venta> {
  return deps.port.reemplazarProductos(input);
}
