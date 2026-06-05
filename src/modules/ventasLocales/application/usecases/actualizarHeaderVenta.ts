import type { VentaEditPort, HeaderInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function actualizarHeaderVenta(
  deps: { port: VentaEditPort },
  input: HeaderInput,
): Promise<Venta> {
  return deps.port.actualizarHeader(input);
}
