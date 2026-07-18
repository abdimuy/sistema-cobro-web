import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { OpcionesZonasCajas } from "../../domain/entities";

// listarOpcionesZonasCajas delegates directly to the port. The 5 Microsip
// catalogs are small and fetched once — no pagination.
export async function listarOpcionesZonasCajas(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<OpcionesZonasCajas> {
  return port.listarOpcionesZonasCajas(signal);
}
