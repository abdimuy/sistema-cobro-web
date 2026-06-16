import type { ClientesPort } from "../ports/ClientesPort";
import type { RefrescarBusquedaOutput } from "../dto";

export async function refrescarBusqueda(
  port: ClientesPort,
): Promise<RefrescarBusquedaOutput> {
  return port.refrescarBusqueda();
}
