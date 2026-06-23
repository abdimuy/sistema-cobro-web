import type { RutasPort } from "../ports/RutasPort";
import type { VentaCobranza } from "../../domain/entities";

export async function desgloseCobranza(
  port: RutasPort,
  zonaId: number,
  signal?: AbortSignal,
): Promise<{ fechaInicioSemana: string | null; ventas: VentaCobranza[] }> {
  return port.desgloseCobranza(zonaId, signal);
}
