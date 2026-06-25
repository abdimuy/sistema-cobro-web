import type { RutasPort } from "../ports/RutasPort";
import type { ReporteUsuario } from "../../domain/entities";

// listarReporteUsuarios delegates directly to the port. Thin by design —
// the report is bounded and read-only.
export async function listarReporteUsuarios(
  port: RutasPort,
  signal?: AbortSignal,
): Promise<ReporteUsuario[]> {
  return port.listarReporteUsuarios(signal);
}
