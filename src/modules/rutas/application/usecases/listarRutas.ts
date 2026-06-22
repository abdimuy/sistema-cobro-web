import type { RutasPort } from "../ports/RutasPort";
import type { Ruta } from "../../domain/entities";

// listarRutas delegates directly to the port. The use case is intentionally
// thin — no pagination, no input validation — because the rutas list is
// bounded and read-only.
export async function listarRutas(
  port: RutasPort,
  signal?: AbortSignal,
): Promise<Ruta[]> {
  return port.listarRutas(signal);
}
