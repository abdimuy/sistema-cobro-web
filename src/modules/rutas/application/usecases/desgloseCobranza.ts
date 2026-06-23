import type { RutasPort } from "../ports/RutasPort";
import type { VentaCobranza } from "../../domain/entities";

export async function desgloseCobranza(
  port: RutasPort,
  zonaId: number,
  signal?: AbortSignal,
): Promise<{
  fechaInicioSemana: string | null;
  ventas: VentaCobranza[];
  resumen: { numerador: string; denominador: number; pctPonderado: string | null };
}> {
  return port.desgloseCobranza(zonaId, signal);
}
