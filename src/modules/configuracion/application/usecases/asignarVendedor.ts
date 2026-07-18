import type { AsignarVendedorInput, ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { VendedorAsignacion } from "../../domain/entities";

// asignarVendedor delegates directly to the port.
export async function asignarVendedor(
  port: ConfiguracionPort,
  input: AsignarVendedorInput,
  signal?: AbortSignal,
): Promise<VendedorAsignacion> {
  return port.asignarVendedor(input, signal);
}
