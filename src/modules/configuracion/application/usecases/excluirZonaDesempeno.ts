import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { ZonaExcluidaDesempeno } from "../../domain/entities";

export async function excluirZonaDesempeno(
  port: ConfiguracionPort,
  zonaId: number,
  signal?: AbortSignal,
): Promise<ZonaExcluidaDesempeno> {
  return port.excluirZonaDesempeno(zonaId, signal);
}
