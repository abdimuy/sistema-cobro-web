import type { VentaEditPort, CombosInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function reemplazarCombosVenta(
  deps: { port: VentaEditPort },
  input: CombosInput,
): Promise<Venta> {
  return deps.port.reemplazarCombos(input);
}
