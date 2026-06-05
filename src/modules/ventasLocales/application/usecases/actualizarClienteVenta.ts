import type { VentaEditPort, ClienteInput } from "../ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";

export async function actualizarClienteVenta(
  deps: { port: VentaEditPort },
  input: ClienteInput,
): Promise<Venta> {
  return deps.port.actualizarCliente(input);
}
