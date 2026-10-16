import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { ZonaExcluidaDesempeno } from "../../domain/entities";

export async function listarZonasExcluidasDesempeno(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<ZonaExcluidaDesempeno[]> {
  return port.listarZonasExcluidasDesempeno(signal);
}
