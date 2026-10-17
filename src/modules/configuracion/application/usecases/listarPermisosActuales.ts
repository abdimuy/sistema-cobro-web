import type { ConfiguracionPort } from "../ports/ConfiguracionPort";

export async function listarPermisosActuales(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<string[]> {
  return port.listarPermisosActuales(signal);
}
