import type { VentaEditPort, VendedoresInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function reemplazarVendedoresVenta(
  deps: { port: VentaEditPort },
  input: VendedoresInput,
): Promise<Venta> {
  return deps.port.reemplazarVendedores(input);
}
