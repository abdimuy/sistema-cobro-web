import type { ConfiguracionPort } from "../ports/ConfiguracionPort";

export async function quitarZonaExcluidaDesempeno(
  port: ConfiguracionPort,
  zonaId: number,
  signal?: AbortSignal,
): Promise<void> {
  return port.quitarZonaExcluidaDesempeno(zonaId, signal);
}
