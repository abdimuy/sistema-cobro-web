import type { VentaEditPort, LineasInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function reemplazarLineasVenta(
  deps: { port: VentaEditPort },
  input: LineasInput,
): Promise<Venta> {
  return deps.port.reemplazarLineas(input);
}
