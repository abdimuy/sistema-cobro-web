import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { ZonaCajaAsignacion } from "../../domain/entities";

// listarZonasCajas delegates directly to the port. Thin on purpose — no
// filtering, no pagination; the backend returns every zone's config.
export async function listarZonasCajas(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<ZonaCajaAsignacion[]> {
  return port.listarZonasCajas(signal);
}
